"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function AdminSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const isDev = process.env.NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION === "true";

  useEffect(() => {
    // Check for error in URL params
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      // Show under development toast in dev mode
      if (isDev) {
        toast.info("Under Development", {
          description: "Admin portal is coming soon!",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=admin&admin_check=true`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      // Show under development toast in dev mode
      if (isDev) {
        toast.info("Under Development", {
          description: "Admin portal is coming soon!",
        });
        setLoading(false);
        return;
      }

      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Extract user
      const user = (data as any)?.user ?? (data as any)?.session?.user;
      if (!user) throw new Error("No user returned from sign in");

      // Fetch profile to verify admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const role = profile.role as string;

      // Only allow admin users
      if (role !== "admin") {
        // Sign out non-admin users immediately
        await supabase.auth.signOut();
        throw new Error(
          "Access denied. Only administrators can access this portal."
        );
      }

      // Admin verified, redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-[#0794d4] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">iP</span>
              </div>
              <span className="text-2xl font-bold text-white">iProf Tutor</span>
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Portal
              </h1>
              <p className="text-gray-600">
                Restricted access - administrators only
              </p>
            </div>

            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full py-5 rounded-full border-2 border-gray-200 text-gray-600 hover:text-gray-600 hover:border-[#0794d4] hover:bg-[#0794d4]/5 text-base font-medium"
                onClick={handleGoogleSignIn}
                disabled={loading}
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Admin email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="h-11 rounded-full border-2 border-gray-200 focus:border-red-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 rounded-full border-2 border-gray-200 focus:border-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEmailSignIn();
                    }
                  }}
                />
              </div>

              {/* Sign In Button */}
              <Button
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-full text-base font-semibold tracking-wide"
                onClick={handleEmailSignIn}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Sign in as Admin"}
              </Button>

              {/* Warning Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 text-center">
                  ⚠️ This portal is restricted to authorized administrators
                  only. Unauthorized access attempts are logged.
                </p>
              </div>

              {/* Back to Main Site */}
              <div className="text-center pt-2">
                <Link
                  href="/auth/sign-in"
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                >
                  ← Back to regular sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <AdminSignInContent />
    </Suspense>
  );
}
