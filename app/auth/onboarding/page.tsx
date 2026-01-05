"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check authentication and fetch user role
    const checkAuthAndRedirect = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/auth/sign-in");
          return;
        }

        // Fetch user profile to get role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, metadata")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error loading profile");
          return;
        }

        // If onboarding is already complete, redirect to dashboard
        if (profile?.metadata?.onboarding_complete) {
          const dashboardPath =
            profile.role === "student"
              ? "/student/dashboard"
              : profile.role === "teacher"
              ? "/teachers/dashboard"
              : profile.role === "parent"
              ? "/parents/dashboard"
              : "/student/dashboard";
          router.push(dashboardPath);
          return;
        }

        // Redirect based on role from database
        if (profile?.role) {
          if (profile.role === "teacher" || profile.role === "parent") {
            toast.info("Under Development", {
              description: `${
                profile.role === "teacher" ? "Teacher" : "Parent"
              } portal is coming soon!`,
            });
            // Optionally redirect to dashboard or sign-in
            setTimeout(() => {
              router.push("/auth/sign-in");
            }, 2000);
            return;
          }

          if (profile.role === "student") {
            router.push("/auth/onboarding/student");
          } else if (profile.role === "teacher") {
            router.push("/auth/onboarding/teacher");
          } else if (profile.role === "parent") {
            router.push("/auth/onboarding/parent");
          }
        } else {
          // No role set - shouldn't happen with proper signup flow
          toast.error("Role not found. Please contact support.");
        }
      } catch (error: any) {
        console.error("Error:", error);
        toast.error("An error occurred");
      }
    };

    checkAuthAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#0794d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}
