"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MainContent from "../components/MainContent";

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const supabase = createClient();
  const isDev = process.env.NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION === "true";

  useEffect(() => {
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

      // Skip parent confirmation in development mode
      const skipParentConfirmation =
        process.env.NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION === "true";

      // Check if student and waiting for parent confirmation (unless skipped)
      if (
        !skipParentConfirmation &&
        profile?.role === "student" &&
        profile?.metadata?.onboarding_complete &&
        !profile?.metadata?.parent_confirmed
      ) {
        router.push("/auth/onboarding/student/waiting");
        return;
      }

      if (!profile || profile.role !== "student") {
        router.push("/auth/sign-in");
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [router, supabase]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0794d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <span className="bg-yellow-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
            Dev Mode
          </span>
        </div>
      )}
      <MainContent />
    </>
  );
}
