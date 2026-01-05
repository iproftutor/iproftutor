import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch performance stats
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  try {
    // Get comprehensive stats using the RPC function
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_performance_stats",
      { p_user_id: user.id, p_days: days }
    );

    if (statsError) {
      console.error("Stats error:", statsError);
      // Fallback: fetch data manually if RPC doesn't exist
      return await getManualStats(supabase, user.id, days);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Performance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

// POST - Log activity (start/end)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, section, contentId, contentTitle, logId, duration } = body;

  // Start activity tracking
  if (action === "start") {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        section,
        content_id: contentId || null,
        content_title: contentTitle || null,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Start activity error:", error);
      return NextResponse.json(
        { error: "Failed to start activity tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ logId: data.id });
  }

  // End activity tracking
  if (action === "end" && logId) {
    // Get the log to calculate duration
    const { data: log } = await supabase
      .from("activity_logs")
      .select("started_at, section")
      .eq("id", logId)
      .single();

    if (log) {
      const durationSeconds =
        duration ||
        Math.floor((Date.now() - new Date(log.started_at).getTime()) / 1000);

      // Update the log
      await supabase
        .from("activity_logs")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq("id", logId);

      // Update daily summary
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("daily_activity_summary")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("section", log.section)
        .single();

      if (existing) {
        await supabase
          .from("daily_activity_summary")
          .update({
            total_time_seconds: existing.total_time_seconds + durationSeconds,
            session_count: existing.session_count + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("daily_activity_summary").insert({
          user_id: user.id,
          date: today,
          section: log.section,
          total_time_seconds: durationSeconds,
          session_count: 1,
          last_activity_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  // Log score (for practice/exam completion)
  if (action === "log_score") {
    const {
      sourceType,
      sourceId,
      subject,
      topic,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
    } = body;

    const { error } = await supabase.from("score_history").insert({
      user_id: user.id,
      source_type: sourceType,
      source_id: sourceId || null,
      subject: subject || null,
      topic: topic || null,
      score,
      total_questions: totalQuestions || null,
      correct_answers: correctAnswers || null,
      time_spent_seconds: timeSpent || 0,
    });

    if (error) {
      console.error("Log score error:", error);
      return NextResponse.json(
        { error: "Failed to log score" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  // Quick time log (for sections without start/end tracking)
  if (action === "log_time") {
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_activity_summary")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("section", section)
      .single();

    if (existing) {
      await supabase
        .from("daily_activity_summary")
        .update({
          total_time_seconds: existing.total_time_seconds + (duration || 0),
          session_count: existing.session_count + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("daily_activity_summary").insert({
        user_id: user.id,
        date: today,
        section,
        total_time_seconds: duration || 0,
        session_count: 1,
        last_activity_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// Fallback manual stats fetching
async function getManualStats(supabase: any, userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Time by section from daily_activity_summary
  const { data: timeBySection } = await supabase
    .from("daily_activity_summary")
    .select("section, total_time_seconds, session_count")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]);

  const sectionTotals: Record<
    string,
    { total_seconds: number; sessions: number }
  > = {};
  timeBySection?.forEach((row: any) => {
    if (!sectionTotals[row.section]) {
      sectionTotals[row.section] = { total_seconds: 0, sessions: 0 };
    }
    sectionTotals[row.section].total_seconds += row.total_time_seconds;
    sectionTotals[row.section].sessions += row.session_count;
  });

  // Last activity
  const { data: lastActivity } = await supabase
    .from("daily_activity_summary")
    .select("section, last_activity_at")
    .eq("user_id", userId)
    .order("last_activity_at", { ascending: false });

  const lastActivityMap: Record<string, string> = {};
  lastActivity?.forEach((row: any) => {
    if (!lastActivityMap[row.section]) {
      lastActivityMap[row.section] = row.last_activity_at;
    }
  });

  // Fetch practice sessions (real practice data)
  const { data: practiceSessions } = await supabase
    .from("practice_sessions")
    .select(
      `
      id,
      score,
      total_questions,
      correct_answers,
      time_spent_seconds,
      started_at,
      completed_at,
      is_completed,
      topic_id,
      practice_topics(name, subject)
    `
    )
    .eq("user_id", userId)
    .eq("is_completed", true)
    .gte("started_at", startDate.toISOString())
    .order("started_at", { ascending: false });

  // Transform practice sessions to score format
  const practiceScores = (practiceSessions || []).map((session: any) => ({
    date: session.completed_at || session.started_at,
    score: session.score || 0,
    avg_score: session.score || 0,
    total_questions: session.total_questions,
    correct_answers: session.correct_answers,
    time_spent: session.time_spent_seconds,
    subject: session.practice_topics?.subject || null,
    topic: session.practice_topics?.name || null,
  }));

  // Also try score_history for any legacy data
  const { data: legacyScores } = await supabase
    .from("score_history")
    .select("*")
    .eq("user_id", userId)
    .eq("source_type", "practice")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  // Merge legacy scores with practice sessions
  const allPracticeScores = [
    ...practiceScores,
    ...(legacyScores || []).map((s: any) => ({
      date: s.created_at,
      score: s.score,
      avg_score: s.score,
      total_questions: s.total_questions,
      correct_answers: s.correct_answers,
      time_spent: s.time_spent_seconds,
      subject: s.subject,
      topic: s.topic,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Exam scores from score_history
  const { data: examScores } = await supabase
    .from("score_history")
    .select("*")
    .eq("user_id", userId)
    .eq("source_type", "mock_exam")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  // Daily activity for last 7 days
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const { data: dailyActivityRaw } = await supabase
    .from("daily_activity_summary")
    .select("date, total_time_seconds, session_count")
    .eq("user_id", userId)
    .gte("date", weekStart.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Aggregate daily activity
  const dailyMap: Record<string, { total_seconds: number; sessions: number }> =
    {};
  (dailyActivityRaw || []).forEach((row: any) => {
    if (!dailyMap[row.date]) {
      dailyMap[row.date] = { total_seconds: 0, sessions: 0 };
    }
    dailyMap[row.date].total_seconds += row.total_time_seconds;
    dailyMap[row.date].sessions += row.session_count;
  });

  // Fill in missing days for the week
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyActivity.push({
      date: dateStr,
      total_seconds: dailyMap[dateStr]?.total_seconds || 0,
      sessions: dailyMap[dateStr]?.sessions || 0,
    });
  }

  // Weekly practice activity from practice_sessions
  const { data: weeklyPractice } = await supabase
    .from("practice_sessions")
    .select("started_at, score, is_completed")
    .eq("user_id", userId)
    .gte("started_at", weekStart.toISOString());

  // Group by day
  const weeklyPracticeByDay: Record<
    string,
    { sessions: number; avgScore: number; scores: number[] }
  > = {};
  (weeklyPractice || []).forEach((session: any) => {
    const date = new Date(session.started_at).toISOString().split("T")[0];
    if (!weeklyPracticeByDay[date]) {
      weeklyPracticeByDay[date] = { sessions: 0, avgScore: 0, scores: [] };
    }
    weeklyPracticeByDay[date].sessions += 1;
    if (session.is_completed && session.score != null) {
      weeklyPracticeByDay[date].scores.push(session.score);
    }
  });

  // Calculate averages
  Object.keys(weeklyPracticeByDay).forEach((date) => {
    const scores = weeklyPracticeByDay[date].scores;
    weeklyPracticeByDay[date].avgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  // Build weekly activity array
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    weeklyActivity.push({
      date: dateStr,
      day: dayName,
      sessions: weeklyPracticeByDay[dateStr]?.sessions || 0,
      avgScore: Math.round(weeklyPracticeByDay[dateStr]?.avgScore || 0),
      studyTime: dailyMap[dateStr]?.total_seconds || 0,
    });
  }

  // Subject performance from practice sessions
  const subjectPerformance: Record<
    string,
    { scores: number[]; attempts: number; lastAttempt: string }
  > = {};
  (practiceSessions || []).forEach((session: any) => {
    const subject = session.practice_topics?.subject || "General";
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        scores: [],
        attempts: 0,
        lastAttempt: "",
      };
    }
    subjectPerformance[subject].scores.push(session.score || 0);
    subjectPerformance[subject].attempts += 1;
    if (
      !subjectPerformance[subject].lastAttempt ||
      session.started_at > subjectPerformance[subject].lastAttempt
    ) {
      subjectPerformance[subject].lastAttempt = session.started_at;
    }
  });

  const subjectsPerformanceArray = Object.entries(subjectPerformance).map(
    ([subject, data]) => ({
      subject,
      avg_score: Math.round(
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ),
      attempts: data.attempts,
      last_attempt: data.lastAttempt,
    })
  );

  // Calculate overall stats
  const totalStudyTime = Object.values(sectionTotals).reduce(
    (acc: number, s: any) => acc + s.total_seconds,
    0
  );

  // Add practice time to study time
  const practiceTime = (practiceSessions || []).reduce(
    (acc: number, s: any) => acc + (s.time_spent_seconds || 0),
    0
  );

  const avgPracticeScore =
    allPracticeScores.length > 0
      ? allPracticeScores.reduce(
          (acc: number, s: any) => acc + (s.score || 0),
          0
        ) / allPracticeScores.length
      : 0;
  const avgExamScore =
    examScores?.length > 0
      ? examScores.reduce((acc: number, s: any) => acc + s.score, 0) /
        examScores.length
      : 0;

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    const hasActivity =
      dailyMap[dateStr]?.sessions > 0 ||
      weeklyPracticeByDay[dateStr]?.sessions > 0;

    if (hasActivity) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  return NextResponse.json({
    time_by_section: Object.entries(sectionTotals).map(([section, data]) => ({
      section,
      ...data,
    })),
    last_activity: Object.entries(lastActivityMap).map(([section, time]) => ({
      section,
      last_activity_at: time,
    })),
    practice_scores: allPracticeScores,
    exam_scores: (examScores || []).map((s: any) => ({
      date: s.created_at,
      score: s.score,
      subject: s.subject,
      topic: s.topic,
    })),
    daily_activity: dailyActivity,
    weekly_activity: weeklyActivity,
    subjects_performance: subjectsPerformanceArray,
    overall: {
      total_study_time: totalStudyTime + practiceTime,
      total_practice_sessions: practiceSessions?.length || 0,
      total_exams_taken: examScores?.length || 0,
      avg_practice_score: Math.round(avgPracticeScore * 10) / 10,
      avg_exam_score: Math.round(avgExamScore * 10) / 10,
      current_streak: currentStreak,
      total_questions_answered: (practiceSessions || []).reduce(
        (acc: number, s: any) => acc + (s.total_questions || 0),
        0
      ),
      total_correct_answers: (practiceSessions || []).reduce(
        (acc: number, s: any) => acc + (s.correct_answers || 0),
        0
      ),
    },
  });
}
