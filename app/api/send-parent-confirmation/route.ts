import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// This route uses Supabase's built-in "Invite user" email template
export async function POST(request: NextRequest) {
  try {
    const { parentEmail, studentName, studentEmail } = await request.json();

    console.log("📨 Parent invite request received:", {
      parentEmail,
      studentName,
      studentEmail,
    });

    if (!parentEmail || !studentName || !studentEmail) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("🔑 Checking env vars:", {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_ROLE_KEY,
    });

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error(
        "⚠️  SUPABASE_SERVICE_ROLE_KEY not configured in .env.local"
      );
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Use inviteUserByEmail - this triggers Supabase's built-in "Invite user" email template
    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    }/auth/parent-confirmed`;

    console.log("📧 Calling inviteUserByEmail with:", {
      parentEmail,
      redirectTo,
    });

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      parentEmail,
      {
        redirectTo,
        data: {
          role: "parent",
          full_name: "", // Parent will set this later
          invited_by: studentEmail,
          invited_student: studentName,
        },
      }
    );

    if (error) {
      console.error("❌ inviteUserByEmail error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to invite parent" },
        { status: 500 }
      );
    }

    console.log("✅ Parent invited successfully:", data);
    return NextResponse.json(
      {
        message: "Parent invited via Supabase built-in email",
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Error inviting parent:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
