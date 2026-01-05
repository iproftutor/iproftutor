import { createClient, createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// Development mode - bypass limits when enabled
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Helper function to extract text from PDF using pdf-parse
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse has a bug where it tries to load test file on import
    // Workaround: require the inner pdf function directly
    const pdfParse = require("pdf-parse/lib/pdf-parse");
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

// Smart content extraction - creates optimized context for AI
function createSmartContext(
  title: string,
  description: string,
  fullText: string,
  maxLength: number = 8000
): string {
  // Clean up the text
  const cleanText = fullText
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  // 1. Extract headings/chapter names (lines that look like titles)
  const headingPatterns = [
    /^(Chapter|CHAPTER|Unit|UNIT|Section|SECTION|Part|PART|Module|MODULE)\s*[\d.:]+\s*[:\-]?\s*(.+)$/gim,
    /^(\d+\.[\d.]*)\s+([A-Z][^.!?\n]{10,80})$/gm,
    /^([A-Z][A-Z\s]{5,50})$/gm,
    /^(#{1,3})\s*(.+)$/gm,
  ];

  const headings: string[] = [];
  for (const pattern of headingPatterns) {
    const matches = fullText.matchAll(pattern);
    for (const match of matches) {
      const heading = (match[2] || match[1] || match[0]).trim();
      if (
        heading.length > 3 &&
        heading.length < 100 &&
        !headings.includes(heading)
      ) {
        headings.push(heading);
      }
    }
  }

  // 2. Extract keywords (frequently occurring important words)
  const words = cleanText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "were",
    "been",
    "will",
    "would",
    "could",
    "should",
    "their",
    "there",
    "which",
    "about",
    "into",
    "more",
    "other",
    "some",
    "than",
    "then",
    "these",
    "they",
    "what",
    "when",
    "where",
    "your",
    "also",
    "each",
    "just",
    "only",
    "over",
    "such",
    "very",
    "after",
    "before",
    "between",
    "through",
    "during",
    "without",
    "again",
    "being",
    "both",
    "come",
    "made",
    "many",
    "most",
    "must",
    "said",
    "same",
    "upon",
  ]);

  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  const keywords = Object.entries(wordFreq)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);

  // 3. Extract content from start, middle, and end
  const sectionSize = Math.floor(maxLength / 4);
  const startContent = cleanText.substring(0, sectionSize);
  const middleStart = Math.floor(cleanText.length * 0.4);
  const middleContent = cleanText.substring(
    middleStart,
    middleStart + sectionSize
  );
  const endContent = cleanText.substring(
    Math.max(0, cleanText.length - sectionSize)
  );

  // 4. Build the final context
  const contextParts: string[] = [];
  contextParts.push(`# Study Guide: ${title}`);
  if (description) {
    contextParts.push(`\n## Description:\n${description}`);
  }
  if (headings.length > 0) {
    contextParts.push(`\n## Document Structure (${headings.length} sections):`);
    contextParts.push(
      headings
        .slice(0, 20)
        .map((h, i) => `${i + 1}. ${h}`)
        .join("\n")
    );
  }
  if (keywords.length > 0) {
    contextParts.push(`\n## Key Topics/Terms:`);
    contextParts.push(keywords.join(", "));
  }
  contextParts.push(`\n## Content from Beginning:`);
  contextParts.push(startContent);
  contextParts.push(`\n## Content from Middle:`);
  contextParts.push(middleContent);
  contextParts.push(`\n## Content from End:`);
  contextParts.push(endContent);

  return contextParts.join("\n");
}

const QUESTION_GENERATION_PROMPT = `You are an expert educational content creator. Generate practice questions based on this study material.

## INSTRUCTIONS
1. Create questions that test understanding, not just memorization
2. Include a mix of difficulty levels (easy, medium, hard)
3. Make questions clear and unambiguous
4. Provide detailed explanations for each answer
5. Ensure correct answers are accurate

## QUESTION TYPES TO GENERATE (mix them)
- multiple_choice: Questions with 4 options (A, B, C, D), only one correct
- true_false: Statements that are either true or false
- fill_blank: Sentences with a blank to fill in (use ___ for the blank)
- short_answer: Questions requiring a brief text answer

## OUTPUT FORMAT
Return a JSON array of questions:
[{
  "question_type": "multiple_choice" | "true_false" | "fill_blank" | "short_answer",
  "difficulty": "easy" | "medium" | "hard",
  "question": "The question text",
  "answer": "The correct answer text",
  "options": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, {"label": "C", "text": "..."}, {"label": "D", "text": "..."}],
  "correct_option": "A" | "B" | "C" | "D" | "true" | "false",
  "explanation": "Detailed explanation of why this is correct"
}]

## STUDY MATERIAL TITLE: {title}

## STUDY MATERIAL CONTENT:
{content}

Generate {count} practice questions. Return ONLY valid JSON array, no markdown.`;

// Helper function to generate questions using DeepSeek
async function generateQuestionsFromContent(
  title: string,
  content: string,
  count: number = 10
): Promise<any[]> {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is not configured");
    throw new Error("AI service not configured");
  }

  const prompt = QUESTION_GENERATION_PROMPT.replace("{title}", title)
    .replace(
      "{content}",
      content || "Generate general questions about: " + title
    )
    .replace("{count}", count.toString());

  console.log("Calling DeepSeek API with title:", title);

  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "You are an expert educational content creator. Always return valid JSON arrays only. No markdown formatting.",
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
  console.log("DeepSeek response received, length:", responseText.length);

  // Clean and parse response - handle various AI response formats
  let cleanedResponse = responseText
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  // Try to extract JSON array if response contains extra text
  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedResponse = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleanedResponse);
    console.log("Successfully parsed", parsed.length, "questions");
    return Array.isArray(parsed) ? parsed : [];
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.log(
      "Raw response (first 500 chars):",
      cleanedResponse.substring(0, 500)
    );
    return [];
  }
}

// GET /api/practice - Get study guides as subjects and user limits
// GET /api/practice?studyGuideId=xxx - Get questions for a study guide
// GET /api/practice?sessionId=xxx - Get session details
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
    const studyGuideId = searchParams.get("studyGuideId");
    const sessionId = searchParams.get("sessionId");

    // Get session details
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .select(
          `
          *,
          content:source_content_id (id, title, description),
          practice_answers (
            id,
            question_id,
            user_answer,
            is_correct,
            time_spent_seconds,
            answered_at,
            practice_questions (
              id,
              question,
              question_type,
              difficulty,
              answer,
              options,
              correct_option,
              explanation
            )
          )
        `
        )
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ session });
    }

    // Get questions for a specific study guide
    if (studyGuideId) {
      const { data: questions, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("source_content_id", studyGuideId)
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;

      return NextResponse.json({ questions: questions || [] });
    }

    // Get all admin study guides as subjects
    const { data: studyGuides, error: guidesError } = await supabase
      .from("content")
      .select("*")
      .eq("content_type", "study_guide")
      .eq("is_admin_upload", true)
      .order("created_at", { ascending: false });

    if (guidesError) throw guidesError;

    // Get question counts per study guide
    const guidesWithCounts = await Promise.all(
      (studyGuides || []).map(async (guide) => {
        const { count } = await supabase
          .from("practice_questions")
          .select("*", { count: "exact", head: true })
          .eq("source_content_id", guide.id);

        return {
          id: guide.id,
          name: guide.title,
          description:
            guide.description || "Practice questions from this study guide",
          file_url: guide.file_url,
          file_name: guide.file_name,
          icon: "📚",
          color: "#0794d4",
          questionCount: count || 0,
          created_at: guide.created_at,
        };
      })
    );

    // Get user's practice limits (in dev mode, return unlimited)
    let limitsData;
    if (DEV_MODE) {
      limitsData = {
        can_practice: true,
        questions_remaining_today: 9999,
        questions_remaining_month: 99999,
        is_paid_user: true,
        daily_limit: 9999,
        monthly_limit: 99999,
      };
    } else {
      const { data: limits } = await supabase.rpc("check_practice_limits", {
        p_user_id: user.id,
      });
      limitsData = limits?.[0];
    }

    // Get user's recent sessions
    const { data: recentSessions } = await supabase
      .from("practice_sessions")
      .select(
        `
        *,
        content:source_content_id (id, title)
      `
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(5);

    // Format recent sessions
    const formattedSessions = (recentSessions || []).map((session) => ({
      ...session,
      practice_topics: {
        name: session.content?.title || "Unknown",
        icon: "📚",
        color: "#0794d4",
      },
    }));

    // Get overall stats
    const { data: allSessions } = await supabase
      .from("practice_sessions")
      .select("score, total_questions, correct_answers")
      .eq("user_id", user.id)
      .eq("is_completed", true);

    const stats = {
      totalSessions: allSessions?.length || 0,
      totalQuestions:
        allSessions?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0,
      totalCorrect:
        allSessions?.reduce((sum, s) => sum + (s.correct_answers || 0), 0) || 0,
      averageScore:
        allSessions && allSessions.length > 0
          ? allSessions.reduce((sum, s) => sum + (s.score || 0), 0) /
            allSessions.length
          : 0,
    };

    return NextResponse.json({
      topics: guidesWithCounts,
      limits: limitsData,
      recentSessions: formattedSessions,
      stats,
    });
  } catch (error: any) {
    console.error("Practice GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch practice data" },
      { status: 500 }
    );
  }
}

// POST /api/practice - Create a new practice session (with auto-generation)
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
    const { action, studyGuideId, difficulty, questionCount = 10 } = body;

    if (action === "start") {
      // Check limits (skip in dev mode)
      if (!DEV_MODE) {
        const { data: limits } = await supabase.rpc("check_practice_limits", {
          p_user_id: user.id,
        });

        const userLimits = limits?.[0];
        if (userLimits && !userLimits.can_practice) {
          return NextResponse.json(
            { error: "Practice limit reached", limits: userLimits },
            { status: 429 }
          );
        }
      }

      // Get the study guide
      const { data: studyGuide, error: guideError } = await supabase
        .from("content")
        .select("*")
        .eq("id", studyGuideId)
        .single();

      if (guideError || !studyGuide) {
        return NextResponse.json(
          { error: "Study guide not found" },
          { status: 404 }
        );
      }

      // Check if we have existing questions for this study guide
      let { data: existingQuestions } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("source_content_id", studyGuideId);

      // Filter by difficulty if specified
      if (difficulty && difficulty !== "all" && existingQuestions) {
        existingQuestions = existingQuestions.filter(
          (q) => q.difficulty === difficulty
        );
      }

      // Smart AI/DB mix logic:
      // For N questions: AI = max(1, floor(N/2)), DB = N - AI
      // This reduces API load while ensuring fresh questions
      const aiQuestionCount = Math.max(1, Math.floor(questionCount / 2));
      const dbQuestionCount = questionCount - aiQuestionCount;

      console.log("\n========== SMART QUESTION MIX ==========");
      console.log(`User requested: ${questionCount} questions`);
      console.log(
        `Target split: ${aiQuestionCount} from AI, ${dbQuestionCount} from DB`
      );
      console.log(
        `Existing questions in DB: ${existingQuestions?.length || 0}`
      );

      // Get questions from database first (if available)
      let dbQuestions: any[] = [];
      if (
        existingQuestions &&
        existingQuestions.length > 0 &&
        dbQuestionCount > 0
      ) {
        // Shuffle and pick random questions from DB
        dbQuestions = existingQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(dbQuestionCount, existingQuestions.length));
        console.log(`Selected ${dbQuestions.length} questions from database`);
      }

      // Calculate how many AI questions we need
      // If DB doesn't have enough, we need more from AI
      const questionsNeededFromAI = questionCount - dbQuestions.length;
      let aiQuestions: any[] = [];

      // Only call AI if we need more questions
      if (questionsNeededFromAI > 0) {
        try {
          console.log(`\nNeed ${questionsNeededFromAI} questions from AI`);
          console.log("\n========== QUESTION GENERATION START ==========");
          console.log("Study Guide Title:", studyGuide.title);
          console.log("Study Guide ID:", studyGuide.id);

          // Extract storage path from file_url (format: .../study-guides/path/to/file.pdf)
          let storagePath: string | null = null;
          if (studyGuide.file_url) {
            const urlParts = studyGuide.file_url.split("/study-guides/");
            if (urlParts.length > 1) {
              storagePath = urlParts[1];
            }
          }
          console.log("File URL:", studyGuide.file_url || "NO FILE");
          console.log("Extracted Storage Path:", storagePath || "NONE");

          // Try to fetch actual content from storage if available
          let contentForGeneration = `${studyGuide.title}\n\n${
            studyGuide.description || ""
          }`;
          let extractionSource = "title/description only";

          // If the study guide has a file, try to fetch its content
          if (storagePath) {
            try {
              console.log("\nFetching file from storage...");
              const adminSupabase = createAdminClient();
              const { data: fileData, error: fileError } =
                await adminSupabase.storage
                  .from("study-guides")
                  .download(storagePath);

              if (!fileError && fileData) {
                const filePathLower = storagePath.toLowerCase();
                console.log("File downloaded, size:", fileData.size, "bytes");

                // Handle PDF files
                if (filePathLower.endsWith(".pdf")) {
                  console.log("\nExtracting text from PDF...");
                  const buffer = Buffer.from(await fileData.arrayBuffer());
                  const pdfText = await extractPdfText(buffer);

                  console.log("\n---------- EXTRACTED PDF TEXT ----------");
                  console.log("Total characters:", pdfText.length);

                  if (pdfText && pdfText.length > 100) {
                    // Use smart context extraction
                    contentForGeneration = createSmartContext(
                      studyGuide.title,
                      studyGuide.description || "",
                      pdfText
                    );
                    extractionSource = `PDF Smart Context (${pdfText.length} chars raw -> ${contentForGeneration.length} chars optimized)`;
                    console.log(
                      "Smart context created:",
                      contentForGeneration.length,
                      "chars"
                    );
                  } else {
                    console.log(
                      "WARNING: PDF extraction returned insufficient text"
                    );
                    extractionSource =
                      "PDF extraction failed - using title only";
                  }
                }
                // Handle text-based files
                else if (
                  filePathLower.endsWith(".txt") ||
                  filePathLower.endsWith(".md") ||
                  filePathLower.endsWith(".doc") ||
                  filePathLower.endsWith(".docx")
                ) {
                  const fileText = await fileData.text();

                  console.log("\n---------- EXTRACTED TEXT FILE ----------");
                  console.log("Total characters:", fileText.length);

                  // Use smart context extraction for text files too
                  contentForGeneration = createSmartContext(
                    studyGuide.title,
                    studyGuide.description || "",
                    fileText
                  );
                  extractionSource = `Text Smart Context (${fileText.length} chars raw -> ${contentForGeneration.length} chars optimized)`;
                }
              } else if (fileError) {
                console.log("ERROR: File download failed:", fileError.message);
                extractionSource = "file download error";
              }
            } catch (fetchError: any) {
              console.log("ERROR: Could not fetch file:", fetchError.message);
              extractionSource = "fetch error";
            }
          }

          console.log("\n---------- GENERATION SUMMARY ----------");
          console.log("Content source:", extractionSource);
          console.log(
            "Final content length:",
            contentForGeneration.length,
            "chars"
          );
          console.log(
            `Generating ${questionsNeededFromAI} questions from AI...`
          );
          console.log("========== STARTING AI GENERATION ==========\n");

          const generatedQuestions = await generateQuestionsFromContent(
            studyGuide.title,
            contentForGeneration,
            questionsNeededFromAI // Only generate what we need
          );

          console.log(
            "Generated questions count:",
            generatedQuestions?.length || 0
          );

          if (generatedQuestions && generatedQuestions.length > 0) {
            // Save generated questions to database using admin client to bypass RLS
            const adminSupabase = createAdminClient();
            const questionsToInsert = generatedQuestions.map((q: any) => ({
              source_content_id: studyGuideId,
              question_type: q.question_type || "multiple_choice",
              difficulty: q.difficulty || "medium",
              question: q.question,
              answer: q.answer || q.correct_option,
              options: q.options ? JSON.stringify(q.options) : null,
              correct_option: q.correct_option,
              explanation: q.explanation,
              is_ai_generated: true,
              is_admin_created: false,
              created_by: user.id,
            }));

            console.log("Inserting questions to database...");
            const { data: savedQuestions, error: insertError } =
              await adminSupabase
                .from("practice_questions")
                .insert(questionsToInsert)
                .select();

            if (insertError) {
              console.error("Database insert error:", insertError);
            } else if (savedQuestions) {
              console.log(
                "Saved",
                savedQuestions.length,
                "questions to database"
              );
              // Use the newly generated questions for AI portion
              aiQuestions = savedQuestions.slice(0, questionsNeededFromAI);
            }
          } else {
            console.log("No questions were generated from AI response");
          }
        } catch (genError) {
          console.error("Question generation error:", genError);
          // Continue with whatever questions we have from DB
        }
      } else {
        console.log("No AI generation needed - enough questions from DB");
      }

      // Combine DB questions and AI questions
      const finalQuestions = [...dbQuestions, ...aiQuestions];

      console.log("\n========== FINAL QUESTION MIX ==========");
      console.log(`DB questions: ${dbQuestions.length}`);
      console.log(`AI questions: ${aiQuestions.length}`);
      console.log(`Total: ${finalQuestions.length}`);

      // Check if we have enough questions
      if (finalQuestions.length === 0) {
        return NextResponse.json(
          { error: "No questions available. Please try again later." },
          { status: 404 }
        );
      }

      // Shuffle the combined questions
      const shuffledQuestions = finalQuestions.sort(() => Math.random() - 0.5);

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .insert({
          user_id: user.id,
          source_content_id: studyGuideId,
          difficulty: difficulty || "mixed",
          total_questions: shuffledQuestions.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return NextResponse.json({
        session,
        studyGuide: {
          id: studyGuide.id,
          title: studyGuide.title,
        },
        questions: shuffledQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          question_type: q.question_type,
          difficulty: q.difficulty,
          options:
            typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        })),
        meta: {
          fromDatabase: dbQuestions.length,
          fromAI: aiQuestions.length,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Practice POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create practice session" },
      { status: 500 }
    );
  }
}

// PUT /api/practice - Submit answer or complete session
export async function PUT(request: NextRequest) {
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
    const { action, sessionId, questionId, answer, timeSpent, answers } = body;

    // Submit all answers at once
    if (action === "submit_all") {
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      if (session.is_completed) {
        return NextResponse.json(
          { error: "Session already completed" },
          { status: 400 }
        );
      }

      // Get all questions for this session
      const questionIds = answers.map((a: any) => a.questionId);
      const { data: questions, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .in("id", questionIds);

      if (questionsError || !questions) {
        return NextResponse.json(
          { error: "Failed to fetch questions" },
          { status: 500 }
        );
      }

      const questionMap = new Map(questions.map((q) => [q.id, q]));
      const results: any[] = [];
      let totalCorrect = 0;
      let totalTime = 0;

      // Process each answer
      for (const ans of answers) {
        const question = questionMap.get(ans.questionId);
        if (!question) continue;

        // Auto-grade
        let isCorrect = false;
        switch (question.question_type) {
          case "multiple_choice":
            isCorrect =
              ans.answer?.toUpperCase() ===
              question.correct_option?.toUpperCase();
            break;
          case "true_false":
            isCorrect =
              ans.answer?.toLowerCase() ===
              question.correct_option?.toLowerCase();
            break;
          case "fill_blank":
            isCorrect =
              ans.answer?.trim().toLowerCase() ===
              question.answer?.trim().toLowerCase();
            break;
          case "short_answer":
            const correctWords = question.answer
              ?.toLowerCase()
              .split(/\s+/)
              .filter((w: string) => w.length > 3);
            const userWords = ans.answer
              ?.toLowerCase()
              .split(/\s+/)
              .filter((w: string) => w.length > 3);
            if (correctWords && userWords) {
              const matchCount = userWords.filter((w: string) =>
                correctWords.includes(w)
              ).length;
              isCorrect = matchCount >= correctWords.length * 0.5;
            }
            break;
        }

        if (isCorrect) totalCorrect++;
        totalTime += ans.timeSpent || 0;

        // Save answer to database
        await supabase.from("practice_answers").insert({
          session_id: sessionId,
          question_id: ans.questionId,
          user_answer: ans.answer,
          is_correct: isCorrect,
          time_spent_seconds: ans.timeSpent || 0,
        });

        // Parse options
        let options = question.options;
        if (typeof options === "string") {
          try {
            options = JSON.parse(options);
          } catch {
            options = null;
          }
        }

        results.push({
          questionId: question.id,
          question: question.question,
          question_type: question.question_type,
          userAnswer: ans.answer,
          correctAnswer:
            question.question_type === "multiple_choice"
              ? question.correct_option
              : question.answer,
          isCorrect,
          explanation: question.explanation,
          options,
        });
      }

      // Update session
      const score =
        answers.length > 0 ? (totalCorrect / answers.length) * 100 : 0;
      await supabase
        .from("practice_sessions")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          correct_answers: totalCorrect,
          score,
          time_spent_seconds: totalTime,
        })
        .eq("id", sessionId);

      // Increment usage
      await supabase.rpc("increment_practice_usage", {
        p_user_id: user.id,
        p_count: answers.length,
      });

      // Log mistakes to mistake_logs table (for incorrect answers)
      const mistakesToLog = results
        .filter((r: any) => !r.isCorrect)
        .map((r: any) => {
          const question = questionMap.get(r.questionId);
          return {
            user_id: user.id,
            source_type: "practice",
            source_id: sessionId,
            question_id: r.questionId,
            question_text: r.question,
            question_type: r.question_type,
            user_answer: r.userAnswer,
            correct_answer: r.correctAnswer,
            explanation: r.explanation,
            subject: session.subject || null,
            topic: session.topic || null,
            tags: session.tags || [],
            difficulty: question?.difficulty || null,
            time_spent_seconds:
              answers.find((a: any) => a.questionId === r.questionId)
                ?.timeSpent || 0,
          };
        });

      if (mistakesToLog.length > 0) {
        await supabase.from("mistake_logs").insert(mistakesToLog);
      }

      // Log score to score_history for performance tracking
      await supabase.from("score_history").insert({
        user_id: user.id,
        source_type: "practice",
        source_id: sessionId,
        subject: session.subject || null,
        topic: session.topic || null,
        score,
        total_questions: answers.length,
        correct_answers: totalCorrect,
        time_spent_seconds: totalTime,
      });

      return NextResponse.json({
        results,
        stats: {
          correct: totalCorrect,
          total: answers.length,
          score,
          timeSpent: totalTime,
        },
      });
    }

    // Submit an answer
    if (action === "answer") {
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      if (session.is_completed) {
        return NextResponse.json(
          { error: "Session already completed" },
          { status: 400 }
        );
      }

      // Get the question
      const { data: question, error: questionError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("id", questionId)
        .single();

      if (questionError || !question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Auto-grade the answer
      let isCorrect = false;

      switch (question.question_type) {
        case "multiple_choice":
          isCorrect =
            answer?.toUpperCase() === question.correct_option?.toUpperCase();
          break;
        case "true_false":
          isCorrect =
            answer?.toLowerCase() === question.correct_option?.toLowerCase();
          break;
        case "fill_blank":
          isCorrect =
            answer?.trim().toLowerCase() ===
            question.answer?.trim().toLowerCase();
          break;
        case "short_answer":
          // Lenient matching for short answers
          const correctWords = question.answer
            ?.toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 3);
          const userWords = answer
            ?.toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 3);
          if (correctWords && userWords) {
            const matchCount = userWords.filter((w: string) =>
              correctWords.includes(w)
            ).length;
            isCorrect = matchCount >= correctWords.length * 0.5;
          }
          break;
      }

      // Save the answer
      const { data: savedAnswer, error: answerError } = await supabase
        .from("practice_answers")
        .insert({
          session_id: sessionId,
          question_id: questionId,
          user_answer: answer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpent || 0,
        })
        .select()
        .single();

      if (answerError) throw answerError;

      // Increment usage
      await supabase.rpc("increment_practice_usage", {
        p_user_id: user.id,
        p_count: 1,
      });

      return NextResponse.json({
        answer: savedAnswer,
        isCorrect,
        correctAnswer:
          question.question_type === "multiple_choice"
            ? question.correct_option
            : question.answer,
        explanation: question.explanation,
      });
    }

    // Complete session
    if (action === "complete") {
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      const { data: answers } = await supabase
        .from("practice_answers")
        .select("is_correct, time_spent_seconds")
        .eq("session_id", sessionId);

      const correctCount = answers?.filter((a) => a.is_correct).length || 0;
      const totalTime =
        answers?.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) || 0;
      const score =
        answers && answers.length > 0
          ? (correctCount / answers.length) * 100
          : 0;

      const { data: updatedSession, error: updateError } = await supabase
        .from("practice_sessions")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          correct_answers: correctCount,
          score,
          time_spent_seconds: totalTime,
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        session: updatedSession,
        stats: {
          correct: correctCount,
          total: answers?.length || 0,
          score,
          timeSpent: totalTime,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Practice PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update practice" },
      { status: 500 }
    );
  }
}
