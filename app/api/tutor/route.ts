import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const SYSTEM_PROMPT = `You are iProf Tutor, a friendly and helpful AI learning assistant for students of all ages. You help with homework, explain concepts, and make learning fun.

## Your Approach:
- Be encouraging and supportive
- Use simple language appropriate for the student
- Break down complex topics into easy-to-understand parts
- Use analogies and real-world examples
- Ask clarifying questions when needed
- Use markdown formatting for better readability (bullet points, bold, code blocks for math/code)

## Guidelines:
- Keep responses focused and helpful
- Don't complete entire homework assignments - guide and teach instead
- Stay on educational topics
- Be patient and never make students feel bad for asking questions

Remember: Every question is a learning opportunity!`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Build messages array
    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [{ role: "system", content: SYSTEM_PROMPT }];

    // Add conversation history (last 10 messages for context)
    const recentHistory = history.slice(-10) as Message[];
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Call DeepSeek API
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const reply =
      response.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Tutor API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI tutor" },
      { status: 500 }
    );
  }
}
