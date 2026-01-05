"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/sign-in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, metadata")
        .eq("id", session.user.id)
        .single();

      // If user already has parent role and completed onboarding, redirect
      if (
        profile?.role === "parent" &&
        profile?.metadata?.onboarding_complete
      ) {
        router.push("/parents/dashboard");
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [router, supabase]);

  const handleGoBack = () => {
    router.push("/auth/onboarding");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0794d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

        {/* Right Column - Parent Info */}
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

            <div className="text-center mb-8">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Parent accounts
              </h1>
              <p className="text-gray-600 mb-6">
                Parent/Guardian accounts are created automatically when linked
                to a student account
              </p>
            </div>

            <div className="space-y-4">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  How to get parent access
                </h3>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex">
                    <span className="font-semibold mr-2">1.</span>
                    <span>
                      Your child (student) creates an account and adds your
                      email during signup
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-semibold mr-2">2.</span>
                    <span>
                      You'll receive an email invitation to link your parent
                      account
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-semibold mr-2">3.</span>
                    <span>
                      Click the link in the email to activate your parent
                      dashboard
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-semibold mr-2">4.</span>
                    <span>
                      Monitor your child's progress and communicate with
                      teachers
                    </span>
                  </li>
                </ol>
              </div>

              {/* Alternative Message */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-700">
                  If your child already has an account, ask them to add you as a
                  parent in their profile settings.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={handleGoBack}
                >
                  ← Back to role selection
                </Button>

                <Button
                  className="w-full h-12 bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full text-base font-semibold"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-gray-500 mt-6">
                Need help?{" "}
                <Link
                  href="/support"
                  className="text-[#0794d4] hover:underline font-medium"
                >
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
