"use client";

import Link from "next/link";
import {
  Users,
  GraduationCap,
  Settings,
  BarChart3,
  Home,
  UserCog,
  FileText,
  ChevronDown,
  LogOut,
  BookOpen,
  Video,
  Image,
  Headphones,
  CreditCard,
  Target,
  Globe,
  Heart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "../context/AdminContext";

export default function AdminSidePanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { selectedCountry } = useAdmin();

  useEffect(() => {
    setMounted(true);
    // Check admin auth status
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth");
        if (response.ok) {
          const data = await response.json();
          setAdminEmail(data.email);
        }
      } catch {
        // Ignore errors
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/sign-in");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAdminDisplayName = () => {
    return adminEmail?.split("@")[0] || "Admin";
  };

  const isActive = (path: string) => pathname === path;
  const isContentActive = () => pathname.startsWith("/admin/content");

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0794d4] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">iP</span>
            </div>
            <span className="text-lg font-bold text-gray-900">iProf Tutor</span>
          </Link>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-semibold">
            ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/dashboard")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/users")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Users</span>
          </Link>
          <Link
            href="/admin/teachers"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/teachers")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Teachers</span>
          </Link>
          <Link
            href="/admin/students"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/students")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <UserCog className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Students</span>
          </Link>
          <Link
            href="/admin/parents"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/parents")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Parents</span>
          </Link>
          <Link
            href="/admin/analytics"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/analytics")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Analytics</span>
          </Link>

          {/* Content Section */}
          <div className="pt-2">
            <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Content {selectedCountry && `• ${selectedCountry.flag}`}
            </span>
          </div>

          {!selectedCountry ? (
            <div className="px-3 py-4 text-center">
              <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                Select a country from the header to manage content
              </p>
            </div>
          ) : (
            <>
              <Link
                href="/admin/content/study-guides"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/study-guides")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Study Guides</span>
              </Link>
              <Link
                href="/admin/content/videos"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/videos")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Videos</span>
              </Link>
              <Link
                href="/admin/content/extras"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/extras")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Image className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Extras</span>
              </Link>
              <Link
                href="/admin/content/podcasts"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/podcasts")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Headphones className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Podcasts</span>
              </Link>
              <Link
                href="/admin/content/notes"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/notes")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Notes</span>
              </Link>
              <Link
                href="/admin/content/flashcards"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/flashcards")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Flashcards</span>
              </Link>
              <Link
                href="/admin/content/practice"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isActive("/admin/content/practice")
                    ? "bg-[#0794d4]/10 text-[#0794d4]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Target className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Practice</span>
              </Link>
            </>
          )}

          {/* System Section */}
          <div className="pt-2">
            <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              System
            </span>
          </div>
          <Link
            href="/admin/settings"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isActive("/admin/settings")
                ? "bg-[#0794d4]/10 text-[#0794d4]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-red-600">
                  {mounted ? getInitials(getAdminDisplayName()) : "AD"}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {mounted ? getAdminDisplayName() : "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {mounted ? adminEmail || "Loading..." : "Loading..."}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
