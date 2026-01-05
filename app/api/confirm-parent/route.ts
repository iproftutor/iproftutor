import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current session (parent who just confirmed via email)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Use service role client to get full user data with metadata
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the parent user with full metadata using admin client
    const { data: parentUserData, error: parentUserError } =
      await supabaseAdmin.auth.admin.getUserById(session.user.id);

    if (parentUserError || !parentUserData?.user) {
      console.error("❌ Error fetching parent user:", parentUserError);
      return NextResponse.json(
        { error: "Failed to fetch parent user data" },
        { status: 500 }
      );
    }

    const invitedByEmail = parentUserData.user.user_metadata?.invited_by;
    const invitedStudentName =
      parentUserData.user.user_metadata?.invited_student;

    console.log("📋 Parent confirmation request:", {
      parentEmail: session.user.email,
      parentUserId: session.user.id,
      invitedByEmail,
      invitedStudentName,
      fullMetadata: parentUserData.user.user_metadata,
    });

    if (!invitedByEmail) {
      return NextResponse.json(
        { error: "Missing student information" },
        { status: 400 }
      );
    }

    // Find student by email in auth.users
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Error listing users:", listError);
      return NextResponse.json(
        { error: "Failed to find student" },
        { status: 500 }
      );
    }

    const studentUser = users.find((u) => u.email === invitedByEmail);

    if (!studentUser) {
      console.error("❌ Student not found with email:", invitedByEmail);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.log("✅ Found student user:", studentUser.id);

    // Get student profile (might not exist if student hasn't completed signup)
    console.log("🔍 Querying profile for student ID:", studentUser.id);

    const { data: studentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, metadata, full_name, role")
      .eq("id", studentUser.id)
      .single();

    console.log("📦 Profile query result:", { studentProfile, profileError });

    // If profile doesn't exist, the student may not have completed signup yet
    // Or the trigger didn't fire - let's create the profile or update via auth user metadata
    if (profileError || !studentProfile) {
      console.log("⚠️ No profile found, checking if we need to create one...");

      // Check if the student user has the role in their metadata
      const studentMetadata = studentUser.user_metadata || {};

      if (studentMetadata.role === "student") {
        // Create the profile since trigger might not have fired
        const { error: createError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: studentUser.id,
            role: "student",
            full_name: studentMetadata.full_name || "",
            metadata: {
              ...studentMetadata,
              parent_confirmed: true,
              confirmed_at: new Date().toISOString(),
              confirmed_by: session.user.email,
            },
          });

        if (createError) {
          console.error("❌ Error creating profile:", createError);
          return NextResponse.json(
            { error: "Failed to create student profile" },
            { status: 500 }
          );
        }

        console.log("✅ Created student profile and confirmed");
        return NextResponse.json({
          success: true,
          studentName:
            invitedStudentName || studentMetadata.full_name || "the student",
        });
      }

      console.error("❌ Error fetching profile:", profileError);
      return NextResponse.json(
        {
          error:
            "Student profile not found. The student may not have completed signup yet.",
        },
        { status: 404 }
      );
    }

    // Update student's metadata
    const updatedMetadata = {
      ...(studentProfile.metadata || {}),
      parent_confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirmed_by: session.user.email,
    };

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ metadata: updatedMetadata })
      .eq("id", studentProfile.id);

    if (updateError) {
      console.error("❌ Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update student profile" },
        { status: 500 }
      );
    }

    console.log("✅ Student account confirmed successfully");

    return NextResponse.json({
      success: true,
      studentName: invitedStudentName || studentProfile.full_name,
    });
  } catch (error: any) {
    console.error("❌ Error in parent confirmation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
