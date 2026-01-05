"use client";

import Link from "next/link";
import {
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Award,
  GraduationCap,
  Video,
  Sparkles,
  CreditCard,
  Headphones,
  FileText,
  ClipboardList,
  FileCheck,
  AlertCircle,
  BarChart3,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PomodoroIndicator } from "@/components/pomodoro";

export default function SidePanel() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    return (
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student"
    );
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#0794d4] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">iP</span>
          </div>
          <span className="text-lg font-bold text-gray-900">iProf Tutor</span>
        </Link>
      </div>

      {/* Pomodoro Timer Indicator */}
      <div className="px-4 py-3 border-b border-gray-100">
        <PomodoroIndicator />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <Link
            href="/student/dashboard"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/dashboard")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            href="/student/study-guide"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/study-guide")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Study Guide</span>
          </Link>
          <Link
            href="/student/video"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/video")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Video className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Video</span>
          </Link>
          <Link
            href="/student/iprof-tutor"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/iprof-tutor")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">iProf Tutor</span>
          </Link>
          <Link
            href="/student/extra"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/extra")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Extra</span>
          </Link>
          <Link
            href="/student/flashcard"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/flashcard")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Flashcard</span>
          </Link>
          <Link
            href="/student/podcast"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/podcast")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Headphones className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Podcast</span>
          </Link>
          <Link
            href="/student/notes"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/notes")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Notes</span>
          </Link>
          <Link
            href="/student/practice"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/practice")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Practice</span>
          </Link>
          <Link
            href="/student/mock-exam"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/mock-exam")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Mock Exam</span>
          </Link>
          <Link
            href="/student/mistakes"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/mistakes")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Mistake Log</span>
          </Link>
          <Link
            href="/student/performance"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/student/performance")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Performance</span>
          </Link>
          <Link
            href="/student/profile"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* User Dropdown */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full focus:outline-none">
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                {user?.user_metadata?.avatar_url ||
                user?.user_metadata?.picture ? (
                  <img
                    src={
                      user.user_metadata.avatar_url ||
                      user.user_metadata.picture
                    }
                    alt="Profile"
                    className="w-9 h-9 rounded-full shrink-0 object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 bg-linear-to-br from-[#0794d4] to-[#0679b0] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {user ? getInitials(getUserDisplayName()) : "ST"}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold leading-relaxed text-gray-900 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || "m@example.com"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56 mb-4">
            <DropdownMenuLabel>
              <div className="flex items-center space-x-3">
                {user?.user_metadata?.avatar_url ||
                user?.user_metadata?.picture ? (
                  <img
                    src={
                      user.user_metadata.avatar_url ||
                      user.user_metadata.picture
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-linear-to-br from-[#0794d4] to-[#0679b0] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {user ? getInitials(getUserDisplayName()) : "ST"}
                    </span>
                  </div>
                )}
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/student/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/student/dashboard/billing"
                className="cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4 text-red-600" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
