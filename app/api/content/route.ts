import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// GET - Fetch content
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // study_guide, video, extra
    const search = searchParams.get("search");
    const adminOnly = searchParams.get("adminOnly") === "true";
    const userOnly = searchParams.get("userOnly") === "true";
    const countryCode = searchParams.get("country_code");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("content_type", type);
    }

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    if (adminOnly) {
      query = query.eq("is_admin_upload", true);
    }

    if (userOnly) {
      query = query
        .eq("uploaded_by", session.user.id)
        .eq("is_admin_upload", false);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error in GET /api/content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create content
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin upload
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // For admin uploads, use service role
    if (body.is_admin_upload && isAdmin) {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabaseAdmin
        .from("content")
        .insert({
          ...body,
          uploaded_by: session.user.id,
          is_admin_upload: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating admin content:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Regular user upload
    const { data, error } = await supabase
      .from("content")
      .insert({
        ...body,
        uploaded_by: session.user.id,
        is_admin_upload: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in POST /api/content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Content ID required" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user email is in admin list
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");

    if (isAdmin) {
      // Admin can delete anything
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabaseAdmin
        .from("content")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Users can only delete their own content
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", id)
        .eq("uploaded_by", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
