import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "iproftutor-admin-secret-key";

// Simple hash function for session token
function generateSessionToken(email: string): string {
  const timestamp = Date.now();
  const data = `${email}:${timestamp}:${ADMIN_SESSION_SECRET}`;
  // Simple base64 encoding - in production use a proper JWT
  return Buffer.from(data).toString("base64");
}

// Verify session token
export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp, secret] = decoded.split(":");

    // Check if email matches and secret is correct
    if (email !== ADMIN_EMAIL || secret !== ADMIN_SESSION_SECRET) {
      return false;
    }

    // Check if token is not expired (24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - tokenTime > twentyFourHours) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// POST - Sign in
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    // Verify credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken(email);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Sign out
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check auth status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken || !verifySessionToken(sessionToken)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, email: ADMIN_EMAIL });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
