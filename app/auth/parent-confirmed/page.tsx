"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ParentConfirmedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("url is:", window.location.href);

    const processAuthAndConfirm = async () => {
      try {
        // Check if there's a hash fragment with access_token (from invite link)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("Found tokens in URL hash, setting session...");

          // Manually set the session from the URL tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            setError("Failed to authenticate. Please try again.");
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log("Session established:", {
              email: data.session.user.email,
              metadata: data.session.user.user_metadata,
            });

            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);

            // Now call API to confirm the student
            const response = await fetch("/api/confirm-parent", {
              method: "POST",
            });

            const responseData = await response.json();

            if (!response.ok) {
              throw new Error(
                responseData.error || "Failed to confirm student"
              );
            }

            setStudentName(responseData.studentName || "the student");
            toast.success("Student account confirmed!");
            setLoading(false);
            return;
          }
        }

        // Check if there's already a session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          console.log("Existing session found:", session.user.email);

          // Call API to confirm the student
          const response = await fetch("/api/confirm-parent", {
            method: "POST",
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.error || "Failed to confirm student");
          }

          setStudentName(responseData.studentName || "the student");
          toast.success("Student account confirmed!");
          setLoading(false);
          return;
        }

        // No tokens and no session - show error
        setError(
          "No authentication found. Please click the confirmation link in your email again."
        );
        setLoading(false);
      } catch (err: any) {
        console.error("Error in confirmation:", err);
        setError(err.message || "An error occurred");
        setLoading(false);
      }
    };

    processAuthAndConfirm();
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=parent`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Sign in failed", {
        description: error.message || "Failed to sign in with Google",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0794d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming student account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Confirmation Failed
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>

          <Link
            href="/auth/sign-in"
            className="inline-block w-full bg-[#0794d4] hover:bg-[#0679b0] text-white py-3 rounded-full font-semibold"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Account Confirmed! 🎉
          </h1>
          <p className="text-gray-600 mb-2">
            Thank you for confirming {studentName}'s account.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            They can now access their student dashboard.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Next step:</strong> Sign in with Google using the same
              email to access your parent dashboard
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-[#0794d4] rounded-full font-semibold transition-colors"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <Link
            href="/"
            className="block w-full border-2 border-gray-200 text-gray-700 hover:border-[#0794d4] hover:bg-[#0794d4]/5 py-3 rounded-full font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
