import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LIVEAVATAR_API_URL = "https://api.liveavatar.com/v1";
const AVATAR_ID = "7a517e8e-b41f-49e7-b6b3-2cdfb4bbff1e";
const CONTEXT_ID = "9aec21a9-3507-4082-b058-abcdd8467fbf";

// GET - Fetch avatar conversation history
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    // If conversationId provided, return single conversation
    if (conversationId) {
      const { data, error } = await supabase
        .from("avatar_conversations")
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

      return NextResponse.json(data);
    }

    // Otherwise return all conversations for the user
    const { data, error } = await supabase
      .from("avatar_conversations")
      .select("id, session_id, messages, started_at, ended_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a session token for FULL Mode
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.LIVEAVATAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LiveAvatar API key not configured" },
        { status: 500 }
      );
    }

    // Create session token for FULL mode with context
    const tokenResponse = await fetch(`${LIVEAVATAR_API_URL}/sessions/token`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: AVATAR_ID,
        avatar_persona: {
          context_id: CONTEXT_ID,
          language: "en",
        },
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("LiveAvatar token error:", errorText);
      return NextResponse.json(
        { error: "Failed to create session token", details: errorText },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log(
      "LiveAvatar token response:",
      JSON.stringify(tokenData, null, 2)
    );

    // The API returns data nested inside a 'data' object
    const responseData = tokenData.data || tokenData;
    const session_id = responseData.session_id || responseData.sessionId;
    const session_token =
      responseData.session_token ||
      responseData.sessionToken ||
      responseData.token;

    if (!session_token) {
      console.error("No session token in response:", tokenData);
      return NextResponse.json(
        { error: "No session token received", data: tokenData },
        { status: 500 }
      );
    }

    // Start the session
    const startResponse = await fetch(`${LIVEAVATAR_API_URL}/sessions/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session_token}`,
        Accept: "application/json",
      },
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error("LiveAvatar start error:", errorText);
      return NextResponse.json(
        { error: "Failed to start session", details: errorText },
        { status: startResponse.status }
      );
    }

    const startData = await startResponse.json();
    console.log(
      "LiveAvatar start response:",
      JSON.stringify(startData, null, 2)
    );

    // Handle nested data structure
    const startResponseData = startData.data || startData;

    // Create avatar conversation record in database
    const { data: conversation, error: dbError } = await supabase
      .from("avatar_conversations")
      .insert({
        user_id: user.id,
        session_id: session_id,
        messages: [],
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to create avatar conversation:", dbError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      sessionId: session_id,
      sessionToken: session_token,
      livekitUrl: startResponseData.livekit_url || startResponseData.livekitUrl,
      livekitToken:
        startResponseData.livekit_client_token ||
        startResponseData.livekitClientToken,
      conversationId: conversation?.id,
    });
  } catch (error) {
    console.error("LiveAvatar API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Save message to avatar conversation
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message required" },
        { status: 400 }
      );
    }

    // Get current messages
    const { data: conversation } = await supabase
      .from("avatar_conversations")
      .select("messages")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    const currentMessages = conversation?.messages || [];
    const updatedMessages = [
      ...currentMessages,
      {
        ...message,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update with new message
    const { error } = await supabase
      .from("avatar_conversations")
      .update({ messages: updatedMessages })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to save message:", error);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// End session or delete conversations
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionToken, conversationId, conversationIds, deleteAll } = body;

    // Delete all conversations for user
    if (deleteAll) {
      const { error } = await supabase
        .from("avatar_conversations")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to delete all conversations:", error);
        return NextResponse.json(
          { error: "Failed to delete conversations" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, deleted: "all" });
    }

    // Delete multiple conversations by IDs
    if (conversationIds && Array.isArray(conversationIds)) {
      const { error } = await supabase
        .from("avatar_conversations")
        .delete()
        .eq("user_id", user.id)
        .in("id", conversationIds);

      if (error) {
        console.error("Failed to delete conversations:", error);
        return NextResponse.json(
          { error: "Failed to delete conversations" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deleted: conversationIds.length,
      });
    }

    // End active session (existing functionality)
    if (sessionToken) {
      // Update conversation end time
      if (conversationId) {
        await supabase
          .from("avatar_conversations")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", conversationId)
          .eq("user_id", user.id);
      }

      // Stop the LiveAvatar session
      const response = await fetch(`${LIVEAVATAR_API_URL}/sessions/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to stop session:", await response.text());
      }

      return NextResponse.json({ success: true });
    }

    // Delete single conversation (no active session)
    if (conversationId && !sessionToken) {
      const { error } = await supabase
        .from("avatar_conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to delete conversation:", error);
        return NextResponse.json(
          { error: "Failed to delete conversation" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, deleted: 1 });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("LiveAvatar delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
