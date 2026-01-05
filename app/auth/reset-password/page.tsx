"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValidSession(true);
      } else {
        setError(
          "Invalid or expired reset link. Please request a new password reset."
        );
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      // Validation
      if (!password || !confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to sign-in after 2 seconds
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
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

        {/* Right Column - Reset Password Form */}
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
                Create new password
              </h1>
              <p className="text-gray-600">
                Enter your new password below to complete the reset
              </p>
            </div>

            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-1">
                    Password reset successful!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your password has been updated. Redirecting to sign in...
                  </p>
                </div>
              )}

              {validSession && !success && (
                <>
                  {/* New Password Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      New password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      className="h-10 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm new password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      className="h-10 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleResetPassword();
                        }
                      }}
                    />
                  </div>

                  {/* Reset Password Button */}
                  <Button
                    className="w-full h-12 bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full text-base font-semibold tracking-wide"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </Button>
                </>
              )}

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  href="/auth/sign-in"
                  className="text-sm text-[#0794d4] hover:underline font-medium"
                >
                  ← Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
