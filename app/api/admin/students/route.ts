import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySessionToken } from "../auth/route";

// GET /api/admin/students - Get all students with emails and activity data
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

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("country_code");
    const gradeLevel = searchParams.get("grade_level");

    // Use admin client to bypass RLS and access auth
    const adminClient = createAdminClient();

    let query = adminClient
      .from("profiles")
      .select(
        `
        id,
        full_name,
        role,
        country,
        country_code,
        grade_level,
        age,
        parent_email,
        parent_confirmed,
        onboarding_completed_at,
        metadata,
        created_at,
        updated_at
      `
      )
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    if (gradeLevel) {
      query = query.eq("grade_level", gradeLevel);
    }

    const { data: students, error } = await query;

    if (error) throw error;

    // Get all users from auth.users using admin API
    const { data: authUsersData, error: authError } =
      await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

    if (authError) throw authError;

    // Create a map of user IDs to auth user data
    const authUsersMap = new Map(
      (authUsersData?.users || []).map((u) => [u.id, u])
    );

    // Fetch practice sessions for activity data
    const { data: sessions } = await adminClient
      .from("practice_sessions")
      .select("user_id, started_at, score, total_questions, is_completed")
      .eq("is_completed", true);

    // Group sessions by user
    const sessionsByUser: Record<string, any[]> = {};
    (sessions || []).forEach((s: any) => {
      if (!sessionsByUser[s.user_id]) {
        sessionsByUser[s.user_id] = [];
      }
      sessionsByUser[s.user_id].push(s);
    });

    // Combine student data with auth and activity data
    const studentsWithData = (students || []).map((student: any) => {
      const authUser = authUsersMap.get(student.id);
      const userSessions = sessionsByUser[student.id] || [];

      // Calculate last active from most recent session
      const sortedSessions = [...userSessions].sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      const lastActive =
        sortedSessions[0]?.started_at ||
        student.updated_at ||
        student.created_at;

      return {
        ...student,
        email: authUser?.email || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        last_active: lastActive,
      };
    });

    return NextResponse.json(studentsWithData);
  } catch (error: any) {
    console.error("Admin students fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}
