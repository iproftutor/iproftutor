import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Verify admin session token
function verifyAdminSession(token: string): boolean {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
    const ADMIN_SESSION_SECRET =
      process.env.ADMIN_SESSION_SECRET || "iproftutor-admin-secret-key";

    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp, secret] = decoded.split(":");

    if (email !== ADMIN_EMAIL || secret !== ADMIN_SESSION_SECRET) {
      return false;
    }

    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - tokenTime > twentyFourHours) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// GET /api/country-packs - Get all country packs with stats
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    // Check for admin session first (custom admin auth)
    const isAdminSession = adminSession && verifyAdminSession(adminSession);

    // If admin session, use admin client
    if (isAdminSession) {
      const adminClient = createAdminClient();
      
      const { searchParams } = new URL(request.url);
      const withStats = searchParams.get("stats") === "true";
      const activeOnly = searchParams.get("active") !== "false";
      const code = searchParams.get("code");

      if (code) {
        // Get specific country by code
        const { data, error } = await adminClient
          .from("country_packs")
          .select("*")
          .eq("code", code)
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      }

      if (withStats) {
        const { data, error } = await adminClient
          .from("country_stats")
          .select("*")
          .order("name");

        if (error) throw error;
        return NextResponse.json(data);
      }

      let query = adminClient.from("country_packs").select("*").order("name");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json(data);
    }

    // Fall back to regular Supabase auth for non-admin users
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin via profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Get query params
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get("stats") === "true";
    const activeOnly = searchParams.get("active") !== "false";

    if (withStats && isAdmin) {
      // Get country stats view for admin
      const { data, error } = await supabase
        .from("country_stats")
        .select("*")
        .order("name");

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Get basic country packs
    let query = supabase.from("country_packs").select("*").order("name");

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Country packs fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch country packs" },
      { status: 500 }
    );
  }
}

// POST /api/country-packs - Create a new country pack (admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const isAdminSession = adminSession && verifyAdminSession(adminSession);

    if (!isAdminSession) {
      // Fall back to Supabase auth check
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const { code, name, flag, currency, is_active, settings } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from("country_packs")
      .insert({
        code: code.toUpperCase(),
        name,
        flag,
        currency: currency || "USD",
        is_active: is_active !== false,
        settings: settings || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Country pack create error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create country pack" },
      { status: 500 }
    );
  }
}

// PUT /api/country-packs - Update a country pack (admin only)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const isAdminSession = adminSession && verifyAdminSession(adminSession);

    if (!isAdminSession) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const { id, code, name, flag, currency, is_active, settings } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (flag !== undefined) updateData.flag = flag;
    if (currency !== undefined) updateData.currency = currency;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (settings !== undefined) updateData.settings = settings;

    const { data, error } = await adminClient
      .from("country_packs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Country pack update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update country pack" },
      { status: 500 }
    );
  }
}

// DELETE /api/country-packs - Delete a country pack (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const isAdminSession = adminSession && verifyAdminSession(adminSession);

    if (!isAdminSession) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if country has any content
    const { data: countryPack } = await adminClient
      .from("country_packs")
      .select("code")
      .eq("id", id)
      .single();

    if (countryPack) {
      // Check for profiles
      const { count: profileCount } = await adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("country_code", countryPack.code);

      if (profileCount && profileCount > 0) {
        return NextResponse.json(
          { error: `Cannot delete: ${profileCount} users are in this country` },
          { status: 400 }
        );
      }

      // Check for content
      const { count: contentCount } = await adminClient
        .from("content")
        .select("*", { count: "exact", head: true })
        .eq("country_code", countryPack.code);

      if (contentCount && contentCount > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete: ${contentCount} content items exist for this country`,
          },
          { status: 400 }
        );
      }
    }

    const { error } = await adminClient
      .from("country_packs")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Country pack delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete country pack" },
      { status: 500 }
    );
  }
}
