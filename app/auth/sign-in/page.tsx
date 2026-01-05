"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [userType, setUserType] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const isDev = process.env.NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION === "true";

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

      // Show under development toast for parent/teacher in dev mode
      if (isDev && (userType === "parent" || userType === "teacher")) {
        toast.info("Under Development", {
          description: `${
            userType === "parent" ? "Parent" : "Teacher"
          } dashboard is coming soon!`,
        });
        setLoading(false);
        return;
      }
      setError("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Extract user (compatible with different supabase return shapes)
      const user = (data as any)?.user ?? (data as any)?.session?.user;
      if (!user) throw new Error("No user returned from sign in");

      // Fetch profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const role = profile.role as string;

      // If user is admin, send to admin dashboard (admin panel is separate)
      if (role === "admin") {
        router.push("/admin/dashboard");
        return;
      }

      // If stored role doesn't match selected userType, prefer the stored role's dashboard
      if (role !== userType) {
        // Redirect to their actual dashboard to avoid accidental cross-role access
        const path =
          role === "teacher"
            ? "/teachers/dashboard"
            : role === "parent"
            ? "/parents/dashboard"
            : "/student/dashboard";
        router.push(path);
        return;
      }

      // Role matches the selected userType: navigate normally
      toast.success("Welcome back!");
      router.push(getDashboardPath());
    } catch (error: any) {
      const errorMsg = error.message || "Failed to sign in";
      setError(errorMsg);
      toast.error("Sign in failed", {
        description: errorMsg,
      });
      setLoading(false);
    }
  };

  const getDashboardPath = () => {
    if (userType === "teacher") {
      return "/teachers/dashboard";
    } else if (userType === "parent") {
      return "/parents/dashboard";
    } else {
      return "/student/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Column - Image */}
        <div className="hidden lg:block relative bg-[#0794d4]/5">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/product/preview1.webp"
                alt="iProf Tutor Platform"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          {/* Logo overlay */}
          <div className="absolute top-8 left-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#0794d4] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">iP</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                iProf Tutor
              </span>
            </Link>
          </div>
        </div>

        {/* Right Column - Sign In Form */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#0794d4] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">iP</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  iProf Tutor
                </span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to continue your learning journey
              </p>
            </div>

            <div className="space-y-4">
              {/* User Type Selection - Only student in dev mode */}
              {!isDev && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    I am a
                  </label>
                  <RadioGroup
                    value={userType}
                    onValueChange={setUserType}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div>
                      <RadioGroupItem
                        value="student"
                        id="student"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="student"
                        className="flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 peer-data-[state=checked]:border-[#0794d4] peer-data-[state=checked]:bg-[#0794d4]/5 cursor-pointer"
                      >
                        <span className="text-sm font-medium">Student</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="teacher"
                        id="teacher"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="teacher"
                        className="flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 peer-data-[state=checked]:border-[#0794d4] peer-data-[state=checked]:bg-[#0794d4]/5 cursor-pointer"
                      >
                        <span className="text-sm font-medium">Teacher</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="parent"
                        id="parent"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="parent"
                        className="flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 peer-data-[state=checked]:border-[#0794d4] peer-data-[state=checked]:bg-[#0794d4]/5 cursor-pointer"
                      >
                        <span className="text-sm font-medium">Parent</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Dev Mode Indicator */}
              {isDev && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800 font-medium\">
                    Development Mode - Student Dashboard Only
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-10 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
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
                    href="/forgot-password"
                    className="text-sm text-[#0794d4] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-10 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Sign In Button */}
              <Button
                className="w-full h-12 bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full text-base font-semibold tracking-wide"
                onClick={handleEmailSignIn}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full py-5 rounded-full border-2 border-gray-200  text-gray-600 hover:text-gray-600 hover:border-[#0794d4] hover:bg-[#0794d4]/5 text-base font-medium"
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

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600 mt-3">
                Don't have an account?{" "}
                <Link
                  href="/auth/get-started"
                  className="text-[#0794d4] font-semibold hover:underline"
                >
                  Get started
                </Link>
              </p>

              {/* Not a Student Link */}
              <p className="text-center text-sm text-gray-500 mt-0">
                Not a student?{" "}
                <Link
                  href="/auth/get-started?type=teacher"
                  className="text-[#0794d4] hover:underline"
                >
                  Teacher
                </Link>
                {" or "}
                <button
                  onClick={() => {
                    setUserType("parent");
                  }}
                  className="text-[#0794d4] hover:underline"
                >
                  Parent
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
