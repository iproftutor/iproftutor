import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// System prompt implementing pedagogical approach
const getSystemPrompt = (
  age: number,
  language: string,
  conversationHistory: string
) => {
  const explanationAge = age - 2; // X-2 rule

  return `You are iProf Tutor, a world-class AI professor designed to teach K-12 students worldwide. Your teaching approach combines the best pedagogical methods to ensure deep understanding and long-term retention.

## STUDENT PROFILE
- Student's Age: ${age} years old
- Explanation Level: Explain concepts as if teaching a ${explanationAge}-year-old (simpler language, more analogies)
- Preferred Language: ${language === "en" ? "English" : language}

## YOUR TEACHING PHILOSOPHY
1. **Feynman Technique**: Break down complex concepts into simple terms. If you can't explain it simply, help the student discover the gaps.
2. **Socratic Method**: Ask guiding questions to lead students to discover answers themselves rather than just giving answers.
3. **Real-World Analogies**: Connect abstract concepts to everyday experiences the student can relate to.
4. **Mnemonics**: Create memorable phrases, acronyms, or stories to help with memorization-heavy topics.
5. **VARK Learning**: Adapt explanations for different learning styles - visual descriptions, step-by-step processes, examples to read, and hands-on activities.
6. **Confidence Building**: Praise effort and progress. Use encouraging language. Celebrate small wins.

## RESPONSE GUIDELINES
- Keep responses concise but thorough
- Use bullet points and numbered lists for clarity
- Do NOT use emojis in your responses
- Ask follow-up questions to check understanding
- If the student seems confused, break it down further
- Use markdown formatting for better readability

## BOUNDARIES
- Stay focused on educational topics (K-12 curriculum subjects)
- Politely redirect off-topic or inappropriate questions back to learning
- Do not complete homework assignments entirely - guide and teach instead
- If asked about topics outside your expertise, acknowledge limitations honestly

## CONVERSATION CONTEXT
${
  conversationHistory
    ? `Previous conversation:\n${conversationHistory}\n\nContinue the conversation naturally, building on what was discussed.`
    : "This is the start of a new conversation."
}

Remember: You're not just providing answers - you're teaching students HOW to learn and think critically. Make every interaction a learning opportunity.`;
};

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

    const { message, conversationId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch user profile for age and language
    const { data: profile } = await supabase
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .single();

    const userAge = profile?.metadata?.age ? Number(profile.metadata.age) : 12;
    const userLanguage = profile?.metadata?.language || "en";

    // Fetch or create THE SINGLE conversation for this user
    let currentConversationId = conversationId;
    let conversationHistory = "";

    // Always try to get existing conversation first
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingConversation) {
      // Use the existing conversation
      currentConversationId = existingConversation.id;

      if (existingConversation.messages) {
        // Build conversation history string for context
        const messages = existingConversation.messages as Array<{
          role: string;
          content: string;
        }>;
        conversationHistory = messages
          .slice(-10) // Keep last 10 messages for context
          .map(
            (m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
          )
          .join("\n");
      }
    } else {
      // No conversation exists, create ONE for this user
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          messages: [],
          title: "Chat History",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      currentConversationId = newConversation.id;
    }

    // Prepare messages for DeepSeek
    const systemPrompt = getSystemPrompt(
      userAge,
      userLanguage,
      conversationHistory
    );

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 1.3, // General conversation temperature
      stream: true,
    });

    // Create a TransformStream for streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;

            // Send chunk to client
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }

          // Save the complete conversation to database
          const { data: conversation } = await supabase
            .from("conversations")
            .select("messages")
            .eq("id", currentConversationId)
            .single();

          const existingMessages =
            (conversation?.messages as Array<{
              role: string;
              content: string;
              timestamp: string;
            }>) || [];

          const updatedMessages = [
            ...existingMessages,
            {
              role: "user",
              content: message,
              timestamp: new Date().toISOString(),
            },
            {
              role: "assistant",
              content: fullResponse,
              timestamp: new Date().toISOString(),
            },
          ];

          await supabase
            .from("conversations")
            .update({
              messages: updatedMessages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentConversationId);

          // Send done signal with conversation ID
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: currentConversationId,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch conversation history
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
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Fetch specific conversation
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation);
    } else {
      // Fetch all conversations for user (list view)
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch conversations" },
          { status: 500 }
        );
      }

      return NextResponse.json(conversations);
    }
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear conversation - deletes ALL conversations for user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Always delete ALL conversations for this user (since we only keep one)
    await supabase.from("conversations").delete().eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
