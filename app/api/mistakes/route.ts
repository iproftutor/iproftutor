import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Get mistake logs with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType"); // 'practice' or 'exam'
    const subject = searchParams.get("subject");
    const resolved = searchParams.get("resolved"); // 'true', 'false', or null for all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const getStats = searchParams.get("stats") === "true";

    // Get stats if requested
    if (getStats) {
      const { data: stats, error: statsError } = await supabase.rpc(
        "get_mistake_stats",
        { p_user_id: user.id }
      );

      if (statsError) {
        console.error("Error getting stats:", statsError);
        return NextResponse.json(
          { error: "Failed to get stats" },
          { status: 500 }
        );
      }

      return NextResponse.json({ stats: stats?.[0] || null });
    }

    // Build query
    let query = supabase
      .from("mistake_logs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }
    if (subject) {
      query = query.eq("subject", subject);
    }
    if (resolved === "true") {
      query = query.eq("is_resolved", true);
    } else if (resolved === "false") {
      query = query.eq("is_resolved", false);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: mistakes, error, count } = await query;

    if (error) {
      console.error("Error fetching mistakes:", error);
      return NextResponse.json(
        { error: "Failed to fetch mistakes" },
        { status: 500 }
      );
    }

    // Get unique subjects for filter dropdown
    const { data: subjects } = await supabase
      .from("mistake_logs")
      .select("subject")
      .eq("user_id", user.id)
      .not("subject", "is", null);

    const uniqueSubjects = [
      ...new Set(subjects?.map((s) => s.subject).filter(Boolean)),
    ];

    return NextResponse.json({
      mistakes: mistakes || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      subjects: uniqueSubjects,
    });
  } catch (error: any) {
    console.error("Mistake logs GET error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Log a new mistake (called from practice/exam submission)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sourceType,
      sourceId,
      questionId,
      questionText,
      questionType,
      userAnswer,
      correctAnswer,
      explanation,
      subject,
      topic,
      tags,
      difficulty,
      timeSpentSeconds,
    } = body;

    // Validate required fields
    if (!sourceType || !questionText || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: mistake, error } = await supabase
      .from("mistake_logs")
      .insert({
        user_id: user.id,
        source_type: sourceType,
        source_id: sourceId || null,
        question_id: questionId || null,
        question_text: questionText,
        question_type: questionType || null,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        subject: subject || null,
        topic: topic || null,
        tags: tags || [],
        difficulty: difficulty || null,
        time_spent_seconds: timeSpentSeconds || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging mistake:", error);
      return NextResponse.json(
        { error: "Failed to log mistake" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mistake });
  } catch (error: any) {
    console.error("Mistake logs POST error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a mistake (mark as resolved/reviewed)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mistakeId, isResolved, reviewedAt } = body;

    if (!mistakeId) {
      return NextResponse.json(
        { error: "mistakeId is required" },
        { status: 400 }
      );
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (typeof isResolved === "boolean") {
      updates.is_resolved = isResolved;
    }
    if (reviewedAt) {
      updates.reviewed_at = reviewedAt;
    }

    const { data: mistake, error } = await supabase
      .from("mistake_logs")
      .update(updates)
      .eq("id", mistakeId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating mistake:", error);
      return NextResponse.json(
        { error: "Failed to update mistake" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mistake });
  } catch (error: any) {
    console.error("Mistake logs PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
