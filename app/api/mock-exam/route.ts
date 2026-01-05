import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - List available exams or get specific exam/session
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  const sessionId = searchParams.get("sessionId");
  const action = searchParams.get("action");

  // Get specific session with answers
  if (sessionId && action === "session") {
    const { data: session, error: sessionError } = await supabase
      .from("mock_exam_sessions")
      .select(
        `
        *,
        exam:mock_exams(*)
      `
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get questions and answers
    const { data: questions } = await supabase
      .from("mock_exam_questions")
      .select("*")
      .eq("exam_id", session.exam_id)
      .order("question_number", { ascending: true });

    const { data: answers } = await supabase
      .from("mock_exam_answers")
      .select("*")
      .eq("session_id", sessionId);

    const answerMap = new Map(answers?.map((a) => [a.question_id, a]) || []);

    return NextResponse.json({
      session,
      questions: questions?.map((q) => ({
        ...q,
        userAnswer: answerMap.get(q.id)?.user_answer || null,
        isAnswered: answerMap.has(q.id),
      })),
    });
  }

  // Get exam details with questions (for starting exam)
  if (examId && action === "start") {
    // Check if exam exists and is published
    const { data: exam, error: examError } = await supabase
      .from("mock_exams")
      .select("*")
      .eq("id", examId)
      .eq("status", "published")
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check date restrictions
    const now = new Date();
    if (exam.start_date && new Date(exam.start_date) > now) {
      return NextResponse.json(
        { error: "Exam has not started yet" },
        { status: 400 }
      );
    }
    if (exam.end_date && new Date(exam.end_date) < now) {
      return NextResponse.json({ error: "Exam has expired" }, { status: 400 });
    }

    // Check for existing session
    const { data: existingSession } = await supabase
      .from("mock_exam_sessions")
      .select("*")
      .eq("exam_id", examId)
      .eq("user_id", user.id)
      .single();

    if (existingSession?.is_submitted) {
      return NextResponse.json(
        {
          error: "You have already submitted this exam",
          session: existingSession,
        },
        { status: 400 }
      );
    }

    // Get questions
    let questionsQuery = supabase
      .from("mock_exam_questions")
      .select(
        "id, question_number, question_type, question, options, marks, topic, difficulty"
      )
      .eq("exam_id", examId);

    if (exam.shuffle_questions) {
      // For shuffling, we'll handle it client-side
    }

    const { data: questions, error: questionsError } =
      await questionsQuery.order("question_number", { ascending: true });

    if (questionsError) {
      return NextResponse.json(
        { error: "Failed to load questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exam,
      questions,
      existingSession,
    });
  }

  // Get exam results
  if (sessionId && action === "results") {
    const { data: session, error: sessionError } = await supabase
      .from("mock_exam_sessions")
      .select(
        `
        *,
        exam:mock_exams(*)
      `
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get questions with answers
    const { data: questions } = await supabase
      .from("mock_exam_questions")
      .select("*")
      .eq("exam_id", session.exam_id)
      .order("question_number", { ascending: true });

    const { data: answers } = await supabase
      .from("mock_exam_answers")
      .select("*")
      .eq("session_id", sessionId);

    const answerMap = new Map(answers?.map((a) => [a.question_id, a]) || []);

    const questionsWithAnswers = questions?.map((q) => {
      const answer = answerMap.get(q.id);
      return {
        ...q,
        userAnswer: answer?.user_answer || null,
        isCorrect: answer?.is_correct,
        marksObtained: answer?.marks_obtained || 0,
        graderFeedback: answer?.grader_feedback,
      };
    });

    return NextResponse.json({
      session,
      questions: questionsWithAnswers,
    });
  }

  // List available exams for student
  const { data: exams, error: examsError } = await supabase
    .from("mock_exams")
    .select(
      `
      id, title, description, exam_type, subject, grade_level,
      duration_minutes, total_marks, passing_marks, instructions,
      start_date, end_date, created_at
    `
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (examsError) {
    return NextResponse.json(
      { error: "Failed to load exams" },
      { status: 500 }
    );
  }

  // Get user's sessions for these exams
  const examIds = exams?.map((e) => e.id) || [];
  const { data: sessions } = await supabase
    .from("mock_exam_sessions")
    .select(
      "exam_id, is_completed, is_submitted, percentage, grade, submitted_at"
    )
    .eq("user_id", user.id)
    .in("exam_id", examIds);

  const sessionMap = new Map(sessions?.map((s) => [s.exam_id, s]) || []);

  const examsWithStatus = exams?.map((exam) => ({
    ...exam,
    session: sessionMap.get(exam.id) || null,
  }));

  return NextResponse.json({ exams: examsWithStatus });
}

// POST - Start exam session or save answer
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, examId, sessionId, questionId, answer, timeSpent } = body;

  // Start a new exam session
  if (action === "start") {
    // Check for existing incomplete session
    const { data: existingSession } = await supabase
      .from("mock_exam_sessions")
      .select("*")
      .eq("exam_id", examId)
      .eq("user_id", user.id)
      .single();

    if (existingSession) {
      if (existingSession.is_submitted) {
        return NextResponse.json(
          { error: "You have already submitted this exam" },
          { status: 400 }
        );
      }
      // Return existing session
      return NextResponse.json({ session: existingSession, resumed: true });
    }

    // Get exam for duration
    const { data: exam } = await supabase
      .from("mock_exams")
      .select("duration_minutes")
      .eq("id", examId)
      .single();

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from("mock_exam_sessions")
      .insert({
        exam_id: examId,
        user_id: user.id,
        time_remaining_seconds: (exam?.duration_minutes || 60) * 60,
      })
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to start exam" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session, resumed: false });
  }

  // Save an answer
  if (action === "save_answer") {
    // Verify session belongs to user and is not submitted
    const { data: session } = await supabase
      .from("mock_exam_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.is_submitted) {
      return NextResponse.json(
        { error: "Exam already submitted" },
        { status: 400 }
      );
    }

    // Upsert answer
    const { error: answerError } = await supabase
      .from("mock_exam_answers")
      .upsert(
        {
          session_id: sessionId,
          question_id: questionId,
          user_answer: answer,
          time_spent_seconds: timeSpent || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id,question_id" }
      );

    if (answerError) {
      return NextResponse.json(
        { error: "Failed to save answer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  // Update time remaining (for persistence)
  if (action === "update_time") {
    const { timeRemaining } = body;

    await supabase
      .from("mock_exam_sessions")
      .update({ time_remaining_seconds: timeRemaining })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// PUT - Submit exam
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, answers } = body;

  // Verify session
  const { data: session, error: sessionError } = await supabase
    .from("mock_exam_sessions")
    .select("*, exam:mock_exams(*)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.is_submitted) {
    return NextResponse.json(
      { error: "Exam already submitted" },
      { status: 400 }
    );
  }

  // Save all remaining answers
  if (answers && answers.length > 0) {
    for (const ans of answers) {
      await supabase.from("mock_exam_answers").upsert(
        {
          session_id: sessionId,
          question_id: ans.questionId,
          user_answer: ans.answer,
          time_spent_seconds: ans.timeSpent || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id,question_id" }
      );
    }
  }

  // Call the grading function
  const { data: result, error: gradeError } = await supabase.rpc(
    "submit_mock_exam",
    { p_session_id: sessionId }
  );

  if (gradeError) {
    console.error("Grading error:", gradeError);
    return NextResponse.json(
      { error: "Failed to grade exam" },
      { status: 500 }
    );
  }

  // Log mistakes for incorrect objective answers
  const { data: examQuestions } = await supabase
    .from("mock_exam_questions")
    .select("*")
    .eq("exam_id", session.exam_id);

  const { data: examAnswers } = await supabase
    .from("mock_exam_answers")
    .select("*")
    .eq("session_id", sessionId);

  const questionMap = new Map(examQuestions?.map((q) => [q.id, q]) || []);

  // Log incorrect answers to mistake_logs
  const mistakesToLog = examAnswers
    ?.filter((a) => a.is_correct === false)
    .map((a) => {
      const question = questionMap.get(a.question_id);
      if (!question) return null;
      return {
        user_id: user.id,
        source_type: "exam",
        source_id: sessionId,
        question_id: a.question_id,
        question_text: question.question,
        question_type: question.question_type,
        user_answer: a.user_answer || "",
        correct_answer: question.correct_answer || question.answer_key || "",
        explanation: question.explanation,
        subject: session.exam?.subject || null,
        topic: question.topic,
        tags: [],
        difficulty: question.difficulty,
        time_spent_seconds: a.time_spent_seconds || 0,
      };
    })
    .filter(Boolean);

  if (mistakesToLog && mistakesToLog.length > 0) {
    await supabase.from("mistake_logs").insert(mistakesToLog);
  }

  // Log score to score_history for performance tracking
  await supabase.from("score_history").insert({
    user_id: user.id,
    source_type: "mock_exam",
    source_id: sessionId,
    subject: session.exam?.subject || null,
    score: result?.percentage || 0,
    total_questions: examAnswers?.length || 0,
    correct_answers:
      examAnswers?.filter((a) => a.is_correct === true).length || 0,
    time_spent_seconds: 0, // Could calculate from session if needed
  });

  // Get updated session
  const { data: updatedSession } = await supabase
    .from("mock_exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  return NextResponse.json({
    success: true,
    result,
    session: updatedSession,
  });
}
