"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Singapore",
  "New Zealand",
  "Ireland",
  "South Africa",
  "Other",
];

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [institute, setInstitute] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated and is a teacher
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

      if (profile?.role !== "teacher") {
        router.push("/auth/onboarding");
        return;
      }

      // If already completed onboarding, redirect to dashboard
      if (profile?.metadata?.onboarding_complete) {
        router.push("/teachers/dashboard");
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [router, supabase]);

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");

      // Validation
      if (!country || !institute || !studentCount) {
        throw new Error("Please fill in all fields");
      }

      const countNum = parseInt(studentCount);
      if (isNaN(countNum) || countNum < 1 || countNum > 10000) {
        throw new Error("Please enter a valid number of students (1-10000)");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Fetch existing metadata first
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("metadata")
        .eq("id", user.id)
        .single();

      // Update profile with teacher data, preserving existing metadata
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          metadata: {
            ...(currentProfile?.metadata || {}),
            onboarding_complete: true,
            country,
            institute,
            expected_student_count: countNum,
            completed_at: new Date().toISOString(),
          },
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Classroom setup complete!", {
        description: "Welcome to iProf Tutor!",
      });

      // Redirect to teacher dashboard
      router.push("/teachers/dashboard");
    } catch (error: any) {
      const errorMsg = error.message || "Failed to complete onboarding";
      setError(errorMsg);
      toast.error("Setup failed", {
        description: errorMsg,
      });
      setLoading(false);
    }
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

        {/* Right Column - Teacher Form */}
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

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-[#0794d4] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <span className="text-sm text-gray-600">of 2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#0794d4] h-2 rounded-full w-full"></div>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Set up your classroom
              </h1>
              <p className="text-gray-600">
                Help us understand your teaching environment
              </p>
            </div>

            <div className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Country Select */}
              <div className="space-y-2">
                <label
                  htmlFor="country"
                  className="text-sm font-medium text-gray-700"
                >
                  Which country are you teaching in?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 rounded-full border-2 border-gray-200 focus:border-[#0794d4]">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Institute Input */}
              <div className="space-y-2">
                <label
                  htmlFor="institute"
                  className="text-sm font-medium text-gray-700"
                >
                  School/Institute name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="institute"
                  type="text"
                  placeholder="Enter your school or institute name"
                  className="h-11 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Student Count Input */}
              <div className="space-y-2">
                <label
                  htmlFor="studentCount"
                  className="text-sm font-medium text-gray-700"
                >
                  How many students do you plan to invite?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="studentCount"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g., 30"
                  className="h-11 rounded-full border-2 border-gray-200 focus:border-[#0794d4]"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  This helps us prepare your classroom workspace
                </p>
              </div>

              {/* Complete Button */}
              <Button
                className="w-full h-12 bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full text-base font-semibold tracking-wide mt-6"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? "Completing setup..." : "Complete setup"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
