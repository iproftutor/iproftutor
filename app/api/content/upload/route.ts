import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const countryCode = formData.get("country_code") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const subject = formData.get("subject") as string;
    const gradeLevel = formData.get("grade_level") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type for study guides
    if (type === "study_guide") {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload PDF or Word documents." },
          { status: 400 }
        );
      }
    }

    // Validate file type for extras (images)
    if (type === "extra") {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload images only." },
          { status: 400 }
        );
      }
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Use service role for storage operations
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${type}/${
      countryCode || "global"
    }/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("content")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("content")
      .getPublicUrl(filePath);

    // Create content record
    const contentData = {
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      description: description || "",
      content_type: type,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      country_code: countryCode || null,
      subject: subject || null,
      grade_level: gradeLevel || null,
      uploaded_by: session.user.id,
      is_admin_upload: isAdmin,
    };

    const { data, error } = await supabaseAdmin
      .from("content")
      .insert(contentData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      // Clean up uploaded file
      await supabaseAdmin.storage.from("content").remove([filePath]);
      return NextResponse.json(
        { error: "Failed to save content record: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in POST /api/content/upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
