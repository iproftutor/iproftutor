"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserCog,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  email: string | null;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  country_code: string | null;
  created_at: string;
  last_active: string | null;
  onboarding_completed_at: string | null;
  study_streak: number;
  xp_points: number;
  questions_done: number;
  status: "active" | "inactive" | "pending";
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch students from admin API (includes emails from auth.users)
      const response = await fetch("/api/admin/students");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch students");
      }
      const profiles = await response.json();

      // Fetch practice sessions to get real activity data
      const { data: sessions } = await supabase
        .from("practice_sessions")
        .select("id, user_id, started_at, score, total_questions, is_completed")
        .eq("is_completed", true);

      // Fetch practice answers for XP calculation
      const { data: answers } = await supabase
        .from("practice_answers")
        .select("session_id, is_correct");

      // Group sessions by user
      const sessionsByUser: Record<string, any[]> = {};
      (sessions || []).forEach((s: any) => {
        if (!sessionsByUser[s.user_id]) {
          sessionsByUser[s.user_id] = [];
        }
        sessionsByUser[s.user_id].push(s);
      });

      // Create session ID to answers mapping
      const sessionIds = (sessions || []).map((s) => s.id);
      const answersBySession: Record<string, any[]> = {};
      (answers || []).forEach((a) => {
        if (!answersBySession[a.session_id]) {
          answersBySession[a.session_id] = [];
        }
        answersBySession[a.session_id].push(a);
      });

      const transformedStudents: Student[] = (profiles || []).map(
        (profile: any) => {
          const userSessions = sessionsByUser[profile.id] || [];

          // Calculate last active from most recent session
          const sortedSessions = [...userSessions].sort(
            (a, b) =>
              new Date(b.started_at).getTime() -
              new Date(a.started_at).getTime()
          );
          const lastActive =
            sortedSessions[0]?.started_at ||
            profile.updated_at ||
            profile.created_at;

          // Calculate streak (consecutive days with activity)
          const sessionDates = userSessions
            .map((s) => new Date(s.started_at).toDateString())
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

          let streak = 0;
          const today = new Date();
          for (let i = 0; i < sessionDates.length; i++) {
            const sessionDate = new Date(sessionDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            if (sessionDate.toDateString() === expectedDate.toDateString()) {
              streak++;
            } else if (i === 0) {
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              if (sessionDate.toDateString() === yesterday.toDateString()) {
                streak++;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          // Calculate XP from answers (10 XP per correct, 5 XP per attempted)
          let totalCorrect = 0;
          let totalAnswers = 0;
          userSessions.forEach((s) => {
            const sessionAnswers = answersBySession[s.id] || [];
            totalAnswers += sessionAnswers.length;
            totalCorrect += sessionAnswers.filter((a) => a.is_correct).length;
          });
          const xpPoints =
            totalCorrect * 10 + (totalAnswers - totalCorrect) * 5;

          // Get grade from grade_level column or metadata
          const grade =
            profile.grade_level || profile.metadata?.grade || "Not specified";

          // Determine status based on onboarding and activity
          let status: "active" | "inactive" | "pending" = "pending";
          const isOnboarded =
            profile.onboarding_completed_at ||
            profile.metadata?.onboarding_complete;

          if (isOnboarded) {
            // Check if active in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const hasRecentActivity =
              sortedSessions.length > 0 &&
              new Date(sortedSessions[0].started_at) > thirtyDaysAgo;

            status = hasRecentActivity ? "active" : "inactive";
          }

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || profile.metadata?.full_name,
            grade,
            school: profile.school || profile.metadata?.school,
            country_code: profile.country_code,
            created_at: profile.created_at,
            last_active: lastActive,
            onboarding_completed_at: profile.onboarding_completed_at,
            study_streak: streak,
            xp_points: xpPoints,
            questions_done: totalAnswers,
            status,
          };
        }
      );

      setStudents(transformedStudents);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      setError(error.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const email = student.email || "";
    const matchesSearch =
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grade?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || student.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const totalXP = students.reduce((acc, s) => acc + s.xp_points, 0);
  const totalQuestions = students.reduce((acc, s) => acc + s.questions_done, 0);
  const avgStreak = students.length
    ? Math.round(
        students.reduce((acc, s) => acc + s.study_streak, 0) / students.length
      )
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-7 h-7 text-[#0794d4]" />
            Students Management
          </h1>
          <p className="text-gray-500 mt-1">
            View and manage all registered students
          </p>
        </div>
        <Button
          onClick={fetchStudents}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCog className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.length}
              </p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.status === "active").length}
              </p>
              <p className="text-sm text-gray-500">Active Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalQuestions.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Questions Answered</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalXP.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total XP Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {filterStatus === "all"
                  ? "All Status"
                  : filterStatus.charAt(0).toUpperCase() +
                    filterStatus.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading students...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <UserCog className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={fetchStudents} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students found</p>
            <p className="text-sm text-gray-400 mt-1">
              Students will appear here when they register
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(student.full_name, student.email)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.full_name || "No name"}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        {student.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">
                            {student.xp_points.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{student.questions_done} questions</span>
                          {student.study_streak > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-500">
                                🔥 {student.study_streak} day streak
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.status === "active" ? (
                        <Badge className="bg-green-100 text-green-700">
                          Active
                        </Badge>
                      ) : student.status === "pending" ? (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Pending
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(student.last_active)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(student.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>View Progress</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
