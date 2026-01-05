import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Admin session verification (duplicated here to avoid import issues in middleware)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "iproftutor-admin-secret-key";

function verifyAdminSession(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp, secret] = decoded.split(":");

    if (email !== ADMIN_EMAIL || secret !== ADMIN_SESSION_SECRET) {
      return false;
    }

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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle admin routes separately
  if (pathname.startsWith("/admin")) {
    // Allow access to sign-in and unauthorized pages
    if (pathname === "/admin/sign-in" || pathname === "/admin/unauthorized") {
      return NextResponse.next();
    }

    // Check admin session cookie
    const adminSession = request.cookies.get("admin_session")?.value;

    if (!adminSession || !verifyAdminSession(adminSession)) {
      // Redirect to admin sign-in
      const url = request.nextUrl.clone();
      url.pathname = "/admin/unauthorized";
      return NextResponse.redirect(url);
    }

    // Admin is authenticated, continue
    return NextResponse.next();
  }

  // Handle regular user routes with Supabase auth
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect authenticated routes (excluding admin which is handled above)
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/student") ||
      request.nextUrl.pathname.startsWith("/teachers") ||
      request.nextUrl.pathname.startsWith("/parents"))
  ) {
    // Redirect to sign-in if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
