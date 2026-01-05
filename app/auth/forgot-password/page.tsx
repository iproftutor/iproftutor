"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      if (!email) {
        throw new Error("Please enter your email address");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
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

        {/* Right Column - Forgot Password Form */}
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
                Reset password
              </h1>
              <p className="text-gray-600">
                Enter your email and we'll send you a link to reset your
                password
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
                    Check your email
                  </h3>
                  <p className="text-sm text-green-700">
                    We've sent a password reset link to <strong>{email}</strong>
                    . Click the link in the email to reset your password.
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
                  disabled={loading || success}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleResetPassword();
                    }
                  }}
                />
              </div>

              {/* Send Reset Link Button */}
              <Button
                className="w-full h-12 bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full text-base font-semibold tracking-wide"
                onClick={handleResetPassword}
                disabled={loading || success}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>

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
