import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const QUESTION_GENERATION_PROMPT = `You are an expert educational content creator. Your task is to generate practice questions based on the provided study material.

## INSTRUCTIONS
1. Create questions that test understanding, not just memorization
2. Include a variety of difficulty levels
3. Make questions clear and unambiguous
4. Provide detailed explanations for each answer
5. Ensure correct answers are accurate

## QUESTION TYPES TO GENERATE
- multiple_choice: Questions with 4 options (A, B, C, D), only one correct
- true_false: Statements that are either true or false
- fill_blank: Sentences with a blank to fill in (use ___ for blank)
- short_answer: Questions requiring a brief text answer

## OUTPUT FORMAT
Return a JSON array of questions. Each question should have:
{
  "question_type": "multiple_choice" | "true_false" | "fill_blank" | "short_answer",
  "difficulty": "easy" | "medium" | "hard",
  "question": "The question text",
  "answer": "The correct answer (for fill_blank and short_answer)",
  "options": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, ...], // Only for multiple_choice
  "correct_option": "A" | "B" | "C" | "D" | "true" | "false", // For multiple_choice and true_false
  "explanation": "Detailed explanation of why this is the correct answer"
}

## STUDY MATERIAL
{content}

## TOPIC: {topic}

Generate {count} practice questions covering the key concepts from this material. Return ONLY a valid JSON array, no markdown or other text.`;

// POST /api/practice/generate - Generate questions from study material
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "teacher"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only admins and teachers can generate questions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contentId, topicId, count = 10, customContent, topicName } = body;

    let studyContent = customContent || "";
    let topic = topicName || "";

    // If contentId is provided, fetch the content
    if (contentId) {
      const { data: content, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentError || !content) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }

      // For PDFs, we would need to extract text - for now use title/description
      // In production, you'd want to use a PDF parsing library or service
      studyContent = `${content.title}\n\n${content.description || ""}`;

      // If file is accessible, you could fetch and parse it
      // For now, we'll rely on the description or custom content
    }

    // Get topic name if topicId provided
    if (topicId && !topic) {
      const { data: topicData } = await supabase
        .from("practice_topics")
        .select("name")
        .eq("id", topicId)
        .single();

      topic = topicData?.name || "General";
    }

    if (!studyContent && !topic) {
      return NextResponse.json(
        { error: "Please provide content or topic to generate questions from" },
        { status: 400 }
      );
    }

    // Generate questions using DeepSeek
    const prompt = QUESTION_GENERATION_PROMPT.replace(
      "{content}",
      studyContent ||
        "No specific content provided. Generate general questions about the topic."
    )
      .replace("{topic}", topic || "General Knowledge")
      .replace("{count}", count.toString());

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator. Always return valid JSON arrays only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";

    // Parse the JSON response
    let questions;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      questions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse questions:", parseError, responseText);
      return NextResponse.json(
        { error: "Failed to parse generated questions" },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions generated" },
        { status: 500 }
      );
    }

    // Save questions to database
    const questionsToInsert = questions.map((q: any) => ({
      topic_id: topicId,
      question_type: q.question_type,
      difficulty: q.difficulty || "medium",
      question: q.question,
      answer: q.answer || q.correct_option,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_option: q.correct_option,
      explanation: q.explanation,
      source_content_id: contentId || null,
      is_ai_generated: true,
      is_admin_created: false,
      created_by: user.id,
    }));

    const { data: savedQuestions, error: insertError } = await supabase
      .from("practice_questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Failed to save questions:", insertError);
      // Still return the generated questions even if save fails
      return NextResponse.json({
        questions,
        saved: false,
        error: insertError.message,
      });
    }

    return NextResponse.json({
      questions: savedQuestions,
      saved: true,
      count: savedQuestions.length,
    });
  } catch (error: any) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}

// GET /api/practice/generate - Get study materials for question generation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get admin study guides that can be used for generation
    const { data: studyGuides, error } = await supabase
      .from("content")
      .select("id, title, description, file_name, created_at")
      .eq("content_type", "study_guide")
      .eq("is_admin_upload", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Get all topics
    const { data: topics } = await supabase
      .from("practice_topics")
      .select("*")
      .eq("is_active", true)
      .order("name");

    return NextResponse.json({
      studyGuides: studyGuides || [],
      topics: topics || [],
    });
  } catch (error: any) {
    console.error("Get study materials error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch study materials" },
      { status: 500 }
    );
  }
}
