import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get profile from database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }

  // Combine auth user data with profile data
  return NextResponse.json({
    // Read-only fields (from auth)
    id: user.id,
    email: user.email,
    email_verified: user.email_confirmed_at ? true : false,
    provider: user.app_metadata?.provider || "email",
    created_at: user.created_at,
    last_sign_in: user.last_sign_in_at,

    // Profile fields
    full_name: profile?.full_name || user.user_metadata?.full_name || "",
    avatar_url:
      profile?.avatar_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    role: profile?.role || "student",

    // Editable settings
    language: profile?.language || "en",
    country: profile?.country || null,
    grade_level: profile?.grade_level || null,
    school_name: profile?.school_name || null,
    date_of_birth: profile?.date_of_birth || null,
    phone: profile?.phone || null,
    timezone: profile?.timezone || "UTC",
    notification_preferences: profile?.notification_preferences || {
      email: true,
      push: true,
      weekly_report: true,
    },

    // Metadata
    updated_at: profile?.updated_at,
  });
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    full_name,
    language,
    country,
    grade_level,
    school_name,
    date_of_birth,
    phone,
    timezone,
    notification_preferences,
    avatar_url,
  } = body;

  // Build update object with only allowed fields
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Editable fields
  if (full_name !== undefined) updateData.full_name = full_name;
  if (language !== undefined) updateData.language = language;
  if (country !== undefined) updateData.country = country;
  if (grade_level !== undefined) updateData.grade_level = grade_level;
  if (school_name !== undefined) updateData.school_name = school_name;
  if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
  if (phone !== undefined) updateData.phone = phone;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (notification_preferences !== undefined)
    updateData.notification_preferences = notification_preferences;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

  // Update profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  // Also update auth user metadata for full_name
  if (full_name !== undefined) {
    await supabase.auth.updateUser({
      data: { full_name },
    });
  }

  return NextResponse.json({ success: true, profile });
}

// POST - Upload avatar
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 2MB." },
      { status: 400 }
    );
  }

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile with new avatar URL
  await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Update auth user metadata
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  return NextResponse.json({ success: true, avatar_url: publicUrl });
}
