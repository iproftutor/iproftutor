import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch practice topics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const countryCode = searchParams.get("country_code");
    const subject = searchParams.get("subject");
    const gradeLevel = searchParams.get("grade_level");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("practice_topics")
      .select(
        `
        *,
        practice_questions(count)
      `
      )
      .order("created_at", { ascending: false });

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    if (gradeLevel) {
      query = query.eq("grade_level", gradeLevel);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching topics:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to include question_count
    const topics = (data || []).map((topic: any) => ({
      ...topic,
      question_count: topic.practice_questions?.[0]?.count || 0,
    }));

    return NextResponse.json(topics);
  } catch (error: any) {
    console.error("Error in GET /api/practice/topics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create practice topic
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

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from("practice_topics")
      .insert({
        ...body,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating topic:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in POST /api/practice/topics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update practice topic
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from("practice_topics")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating topic:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in PUT /api/practice/topics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete practice topic
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete questions first (cascade)
    await supabaseAdmin.from("practice_questions").delete().eq("topic_id", id);

    // Delete topic
    const { error } = await supabaseAdmin
      .from("practice_topics")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting topic:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/practice/topics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
