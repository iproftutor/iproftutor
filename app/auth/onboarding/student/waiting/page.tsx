"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WaitingForParentPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/sign-in");
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-[#0794d4] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">iP</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              iProf Tutor
            </span>
          </Link>
        </div>

        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Almost There!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Please wait until your parent or guardian confirms your account
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What happens next?
          </h2>
          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0794d4] text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">1</span>
              </div>
              <p className="text-gray-700">
                Your parent/guardian will receive an email to confirm your
                account
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0794d4] text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">2</span>
              </div>
              <p className="text-gray-700">
                Once they approve, you'll get access to your learning dashboard
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0794d4] text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">3</span>
              </div>
              <p className="text-gray-700">
                You can start learning and your parent can monitor your progress
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Check your email or ask your parent to check theirs for the
            confirmation link.
          </p>
          <button
            onClick={handleSignOut}
            className="text-[#0794d4] hover:text-[#0679b0] font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
