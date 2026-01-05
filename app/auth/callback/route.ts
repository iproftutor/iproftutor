import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const adminCheck = searchParams.get("admin_check");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Fetch the user's profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, metadata")
        .eq("id", data.user.id)
        .single();

      const userRole = profile?.role || "student";
      const onboardingComplete =
        profile?.metadata?.onboarding_complete || false;

      // If this is an admin portal OAuth login, verify admin role
      if (adminCheck === "true") {
        if (userRole !== "admin") {
          // Sign out non-admin users trying to access admin portal
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/auth/admin-signin?error=Access denied. Only administrators can access this portal.`
          );
        }
        // Admin verified, go to admin dashboard
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      }

      // Check if user needs onboarding
      if (!onboardingComplete) {
        // Redirect to onboarding
        return NextResponse.redirect(`${origin}/auth/onboarding`);
      }

      // Onboarding complete, redirect to role-based dashboard
      let next = "/student/dashboard";

      if (userRole === "admin") {
        next = "/admin/dashboard";
      } else if (userRole === "teacher") {
        next = "/teachers/dashboard";
      } else if (userRole === "parent") {
        next = "/parents/dashboard";
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to sign-in page if there's an error
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
