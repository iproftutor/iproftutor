"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Users,
  GraduationCap,
  UserCog,
  Heart,
  BookOpen,
  Clock,
  Trophy,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalAdmins: number;
  verifiedUsers: number;
  pendingUsers: number;
  totalXP: number;
  avgStudyStreak: number;
  totalContent: {
    studyGuides: number;
    videos: number;
    flashcards: number;
    podcasts: number;
    notes: number;
    practice: number;
  };
  subscriptions: {
    free: number;
    basic: number;
    basicVoice: number;
    premium: number;
  };
  recentUsers: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const allProfiles = profiles || [];

      // Calculate user stats
      const totalUsers = allProfiles.length;
      const totalStudents = allProfiles.filter(
        (p) => p.role === "student"
      ).length;
      const totalTeachers = allProfiles.filter(
        (p) => p.role === "teacher"
      ).length;
      const totalParents = allProfiles.filter(
        (p) => p.role === "parent"
      ).length;
      const totalAdmins = allProfiles.filter((p) => p.role === "admin").length;
      const verifiedUsers = allProfiles.filter(
        (p) => p.email_confirmed_at
      ).length;
      const pendingUsers = allProfiles.filter(
        (p) => !p.email_confirmed_at
      ).length;

      // Calculate XP and streaks
      const totalXP = allProfiles.reduce(
        (acc, p) => acc + (p.xp_points || 0),
        0
      );
      const studentsWithStreak = allProfiles.filter((p) => p.study_streak);
      const avgStudyStreak = studentsWithStreak.length
        ? Math.round(
            studentsWithStreak.reduce(
              (acc, p) => acc + (p.study_streak || 0),
              0
            ) / studentsWithStreak.length
          )
        : 0;

      // Fetch content counts
      const [
        { count: studyGuides },
        { count: videos },
        { count: flashcards },
        { count: podcasts },
        { count: notes },
        { count: practice },
      ] = await Promise.all([
        supabase
          .from("study_guides")
          .select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("flashcards").select("*", { count: "exact", head: true }),
        supabase.from("podcasts").select("*", { count: "exact", head: true }),
        supabase.from("notes").select("*", { count: "exact", head: true }),
        supabase
          .from("practice_questions")
          .select("*", { count: "exact", head: true }),
      ]);

      // Fetch subscription stats
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan");

      const subCounts = {
        free: 0,
        basic: 0,
        basicVoice: 0,
        premium: 0,
      };

      (subscriptions || []).forEach((sub) => {
        if (sub.plan === "free") subCounts.free++;
        else if (sub.plan === "basic") subCounts.basic++;
        else if (sub.plan === "basic_voice") subCounts.basicVoice++;
        else if (sub.plan === "premium") subCounts.premium++;
      });

      // Recent users (last 5)
      const recentUsers = allProfiles.slice(0, 5).map((p) => ({
        id: p.id,
        email: p.email || "No email",
        full_name: p.full_name || p.name,
        role: p.role || "user",
        created_at: p.created_at,
      }));

      setData({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        totalAdmins,
        verifiedUsers,
        pendingUsers,
        totalXP,
        avgStudyStreak,
        totalContent: {
          studyGuides: studyGuides || 0,
          videos: videos || 0,
          flashcards: flashcards || 0,
          podcasts: podcasts || 0,
          notes: notes || 0,
          practice: practice || 0,
        },
        subscriptions: subCounts,
        recentUsers,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-green-100 text-green-700";
      case "teacher":
        return "bg-blue-100 text-blue-700";
      case "parent":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#0794d4] animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalContent = Object.values(data.totalContent).reduce(
    (a, b) => a + b,
    0
  );
  const totalSubscribers =
    data.subscriptions.basic +
    data.subscriptions.basicVoice +
    data.subscriptions.premium;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#0794d4]" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Live platform insights and performance metrics
          </p>
        </div>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">
                {data.totalUsers.toLocaleString()}
              </p>
              <Badge className="bg-blue-100 text-blue-700">
                {data.verifiedUsers} verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">
                {data.totalStudents.toLocaleString()}
              </p>
              <Badge className="bg-green-100 text-green-700">
                {data.totalUsers > 0
                  ? Math.round((data.totalStudents / data.totalUsers) * 100)
                  : 0}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">{data.totalTeachers}</p>
              <Badge className="bg-blue-100 text-blue-700">Educators</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Parents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">{data.totalParents}</p>
              <Badge className="bg-purple-100 text-purple-700">Guardians</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Recent Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Platform Metrics</CardTitle>
            <CardDescription>Content and engagement statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Trophy className="w-4 h-4" />
                  Total XP Earned
                </div>
                <p className="text-2xl font-bold">
                  {data.totalXP.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  Avg. Study Streak
                </div>
                <p className="text-2xl font-bold">{data.avgStudyStreak} days</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Total Content
                </div>
                <p className="text-2xl font-bold">
                  {totalContent.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Study Guides
                </div>
                <p className="text-2xl font-bold">
                  {data.totalContent.studyGuides}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <BarChart3 className="w-4 h-4" />
                  Videos
                </div>
                <p className="text-2xl font-bold">{data.totalContent.videos}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Flashcards
                </div>
                <p className="text-2xl font-bold">
                  {data.totalContent.flashcards}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Signups</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentUsers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No users yet
                </p>
              ) : (
                data.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#0794d4] to-[#0569a0] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {(user.full_name || user.email)
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name || "No name"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Overview
          </CardTitle>
          <CardDescription>Current plan distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">
                {data.subscriptions.free}
              </p>
              <p className="text-sm text-gray-500 mt-1">Free Plan</p>
              <Badge variant="secondary" className="mt-2">
                $0/mo
              </Badge>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">
                {data.subscriptions.basic}
              </p>
              <p className="text-sm text-gray-500 mt-1">Basic Plan</p>
              <Badge className="mt-2 bg-blue-100 text-blue-700">$15/mo</Badge>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-700">
                {data.subscriptions.basicVoice}
              </p>
              <p className="text-sm text-gray-500 mt-1">Basic + Voice</p>
              <Badge className="mt-2 bg-purple-100 text-purple-700">
                $25/mo
              </Badge>
            </div>
            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">
                {data.subscriptions.premium}
              </p>
              <p className="text-sm text-gray-500 mt-1">Premium</p>
              <Badge className="mt-2 bg-orange-100 text-orange-700">
                $35/mo
              </Badge>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid Subscribers</p>
                <p className="text-2xl font-bold">{totalSubscribers}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Est. Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  $
                  {(
                    data.subscriptions.basic * 15 +
                    data.subscriptions.basicVoice * 25 +
                    data.subscriptions.premium * 35
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Distribution</CardTitle>
          <CardDescription>Breakdown by content type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Study Guides",
                count: data.totalContent.studyGuides,
                color: "from-blue-500 to-blue-600",
              },
              {
                name: "Videos",
                count: data.totalContent.videos,
                color: "from-red-500 to-red-600",
              },
              {
                name: "Flashcards",
                count: data.totalContent.flashcards,
                color: "from-green-500 to-green-600",
              },
              {
                name: "Podcasts",
                count: data.totalContent.podcasts,
                color: "from-purple-500 to-purple-600",
              },
              {
                name: "Notes",
                count: data.totalContent.notes,
                color: "from-yellow-500 to-yellow-600",
              },
              {
                name: "Practice Questions",
                count: data.totalContent.practice,
                color: "from-pink-500 to-pink-600",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-700">
                  {item.name}
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-linear-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${
                          totalContent > 0
                            ? (item.count / totalContent) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-semibold">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
