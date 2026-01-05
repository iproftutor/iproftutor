import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySessionToken } from "../auth/route";

// GET /api/admin/users - Get all users with emails from auth.users
export async function GET(request: NextRequest) {
  try {
    // Check admin session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken || !verifySessionToken(sessionToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Use admin client to get all profiles
    const adminClient = createAdminClient();

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      throw profilesError;
    }

    // Get all users from auth.users using admin API
    const { data: authUsersData, error: authError } =
      await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

    if (authError) {
      console.error("Auth users fetch error:", authError);
      throw authError;
    }

    // Create a map of user IDs to auth user data
    const authUsersMap = new Map(
      (authUsersData?.users || []).map((u) => [u.id, u])
    );

    // Combine profile data with auth user data
    const usersWithAuth = (profiles || []).map((profile: any) => {
      const authUser = authUsersMap.get(profile.id);
      return {
        id: profile.id,
        email: authUser?.email || null,
        created_at: profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        onboarding_completed_at: profile.onboarding_completed_at,
        metadata: profile.metadata,
        user_metadata: {
          full_name: profile.full_name || authUser?.user_metadata?.full_name,
          avatar_url: profile.avatar_url || authUser?.user_metadata?.avatar_url,
        },
        app_metadata: {
          role: profile.role || "user",
        },
      };
    });

    return NextResponse.json(usersWithAuth);
  } catch (error: any) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
