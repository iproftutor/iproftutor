"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BookOpen,
  Target,
  TrendingUp,
  GraduationCap,
  Video,
  Sparkles,
  CreditCard,
  Headphones,
  FileText,
  ClipboardList,
  FileCheck,
  AlertCircle,
  Flame,
  ChevronRight,
  Play,
  Brain,
  Trophy,
  Star,
  ArrowUpRight,
  Layers,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  activeSubjects: number;
  questionsDone: number;
  avgScore: number;
  achievements: number;
  streak: number;
  xp: number;
}

interface SubjectProgress {
  name: string;
  progress: number;
  color: string;
  icon: string;
  lastTopic?: string;
}

interface PerformanceData {
  subject: string;
  score: number;
  color: string;
}

export default function MainContent() {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeSubjects: 0,
    questionsDone: 0,
    avgScore: 0,
    achievements: 0,
    streak: 0,
    xp: 0,
  });
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch practice sessions for stats
        const { data: sessions } = await supabase
          .from("practice_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_completed", true);

        // Fetch practice topics
        const { data: topics } = await supabase
          .from("practice_topics")
          .select("*")
          .eq("is_active", true);

        // Fetch practice answers count
        const { data: answers } = await supabase
          .from("practice_answers")
          .select("id, is_correct, session_id")
          .in(
            "session_id",
            (sessions || []).map((s) => s.id)
          );

        // Calculate stats
        const totalQuestions = answers?.length || 0;
        const correctAnswers = answers?.filter((a) => a.is_correct).length || 0;
        const avgScore =
          totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;

        // Calculate streak (consecutive days with activity)
        const sessionDates = (sessions || [])
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
          } else if (
            i === 0 &&
            sessionDate.toDateString() ===
              new Date(today.setDate(today.getDate() - 1)).toDateString()
          ) {
            streak++;
          } else {
            break;
          }
        }

        // Calculate XP (10 XP per correct answer, 5 XP per question attempted)
        const xp = correctAnswers * 10 + (totalQuestions - correctAnswers) * 5;

        // Get unique subjects practiced
        const uniqueTopicIds = [
          ...new Set((sessions || []).map((s) => s.topic_id).filter(Boolean)),
        ];
        const activeSubjects = uniqueTopicIds.length || topics?.length || 0;

        // Calculate achievements (milestones)
        let achievements = 0;
        if (totalQuestions >= 10) achievements++;
        if (totalQuestions >= 50) achievements++;
        if (totalQuestions >= 100) achievements++;
        if (totalQuestions >= 500) achievements++;
        if (avgScore >= 60) achievements++;
        if (avgScore >= 80) achievements++;
        if (avgScore >= 90) achievements++;
        if (streak >= 3) achievements++;
        if (streak >= 7) achievements++;
        if (streak >= 30) achievements++;
        if ((sessions || []).length >= 5) achievements++;
        if ((sessions || []).length >= 20) achievements++;

        setStats({
          activeSubjects,
          questionsDone: totalQuestions,
          avgScore,
          achievements,
          streak: Math.max(streak, 0),
          xp,
        });

        // Build subject progress from topics and sessions
        const subjectColors = [
          "#0794d4",
          "#10B981",
          "#8B5CF6",
          "#F59E0B",
          "#EF4444",
          "#6366F1",
        ];
        const subjectProgressData: SubjectProgress[] = (topics || [])
          .slice(0, 3)
          .map((topic, index) => {
            const topicSessions = (sessions || []).filter(
              (s) => s.topic_id === topic.id
            );
            const topicAnswers =
              topicSessions.length > 0
                ? Math.round(
                    topicSessions.reduce((acc, s) => acc + (s.score || 0), 0) /
                      topicSessions.length
                  )
                : 0;
            return {
              name: topic.name,
              progress: Math.min(topicAnswers, 100),
              color: topic.color || subjectColors[index % subjectColors.length],
              icon: topic.icon || "📚",
              lastTopic: topicSessions[0]?.difficulty || "Getting Started",
            };
          });
        setSubjectProgress(subjectProgressData);

        // Build performance data
        const performanceColors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];
        const perfData: PerformanceData[] = (topics || [])
          .slice(0, 4)
          .map((topic, index) => {
            const topicSessions = (sessions || []).filter(
              (s) => s.topic_id === topic.id
            );
            const topicScore =
              topicSessions.length > 0
                ? Math.round(
                    topicSessions.reduce((acc, s) => acc + (s.score || 0), 0) /
                      topicSessions.length
                  )
                : 0;
            return {
              subject: topic.name,
              score: topicScore,
              color: performanceColors[index % performanceColors.length],
            };
          });
        setPerformanceData(perfData);

        // Recent practice sessions
        const recentSessions = (sessions || [])
          .sort(
            (a, b) =>
              new Date(b.started_at).getTime() -
              new Date(a.started_at).getTime()
          )
          .slice(0, 5);
        setRecentActivity(recentSessions);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [supabase]);

  const getUserDisplayName = () => {
    return (
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student"
    );
  };

  const quickActions = [
    {
      title: "Study Guide",
      description: "Continue your lessons",
      icon: BookOpen,
      href: "/student/study-guide",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "iProf Tutor",
      description: "AI-powered tutoring",
      icon: Sparkles,
      href: "/student/iprof-tutor",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Practice",
      description: "Test your knowledge",
      icon: ClipboardList,
      href: "/student/practice",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Mock Exam",
      description: "Prepare for exams",
      icon: FileCheck,
      href: "/student/mock-exam",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const learningTools = [
    {
      title: "Video Lessons",
      icon: Video,
      href: "/student/video",
    },
    {
      title: "Flashcards",
      icon: Layers,
      href: "/student/flashcard",
    },
    {
      title: "Podcasts",
      icon: Headphones,
      href: "/student/podcast",
    },
    {
      title: "Notes",
      icon: FileText,
      href: "/student/notes",
    },
    {
      title: "Extra",
      icon: CreditCard,
      href: "/student/extra",
    },
    {
      title: "Mistake Log",
      icon: AlertCircle,
      href: "/student/mistakes",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#0794d4] mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {greeting}, {getUserDisplayName()}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-orange-700">
              {stats.streak} day streak
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-yellow-700">
              {stats.xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0794d4]/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#0794d4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeSubjects}
              </p>
              <p className="text-sm text-gray-500">Active Subjects</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.questionsDone}
              </p>
              <p className="text-sm text-gray-500">Questions Done</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgScore}%
              </p>
              <p className="text-sm text-gray-500">Avg. Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.achievements}
              </p>
              <p className="text-sm text-gray-500">Achievements</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group h-full">
                <div
                  className={`w-12 h-12 ${action.lightColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className={`w-6 h-6 ${action.textColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
                <div className="mt-3 flex items-center text-sm font-medium text-[#0794d4]">
                  Open <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Continue Learning
              </h2>
              <Link
                href="/student/study-guide"
                className="text-sm text-[#0794d4] hover:underline flex items-center"
              >
                View all <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {subjectProgress.length > 0 ? (
                subjectProgress.map((subject, index) => {
                  const colors = ["#0794d4", "#10B981", "#8B5CF6"];
                  const bgColors = [
                    "from-[#0794d4]/5",
                    "from-green-500/5",
                    "from-purple-500/5",
                  ];
                  const borderColors = [
                    "border-[#0794d4]/10 hover:border-[#0794d4]/30",
                    "border-green-500/10 hover:border-green-500/30",
                    "border-purple-500/10 hover:border-purple-500/30",
                  ];
                  const btnColors = [
                    "bg-[#0794d4] hover:bg-[#0679b0]",
                    "bg-green-500 hover:bg-green-600",
                    "bg-purple-500 hover:bg-purple-600",
                  ];

                  return (
                    <div
                      key={subject.name}
                      className={`flex items-center gap-4 p-4 bg-linear-to-r ${
                        bgColors[index % 3]
                      } to-transparent rounded-xl border ${
                        borderColors[index % 3]
                      } transition-colors`}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                        style={{ backgroundColor: colors[index % 3] }}
                      >
                        <span>{subject.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {subject.lastTopic || "Start your first lesson"}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${subject.progress}%`,
                              backgroundColor: colors[index % 3],
                            }}
                          ></div>
                        </div>
                      </div>
                      <Link href="/student/practice">
                        <Button
                          size="sm"
                          className={`${btnColors[index % 3]} shrink-0`}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Practice
                        </Button>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No subjects started yet</p>
                  <Link href="/student/study-guide">
                    <Button
                      size="sm"
                      className="mt-3 bg-[#0794d4] hover:bg-[#0679b0]"
                    >
                      Start Learning
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {recentActivity.length} sessions
              </Badge>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      session.score >= 80
                        ? "bg-green-50 border-green-100"
                        : session.score >= 60
                        ? "bg-blue-50 border-blue-100"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        session.score >= 80
                          ? "bg-green-500"
                          : session.score >= 60
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                    >
                      <span className="text-white text-xs font-bold">
                        {Math.round(session.score)}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Practice Session
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.started_at).toLocaleDateString()} •{" "}
                        {session.total_questions} questions
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <Link href="/student/practice">
                    <Button size="sm" variant="outline" className="mt-2">
                      Start Practicing
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Learning Tools Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Learning Tools
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {learningTools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <tool.icon className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">
                  {tool.title}
                </h3>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Performance & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Performance by Subject
            </h2>
            <Link
              href="/student/performance"
              className="text-sm text-[#0794d4] hover:underline flex items-center"
            >
              Details <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {performanceData.length > 0 ? (
              performanceData.map((item) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.subject}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${item.score}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No performance data yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Complete practice sessions to see your progress
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Study Tips */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Study Tips</h2>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              Personalized
            </Badge>
          </div>
          <div className="space-y-4">
            {stats.avgScore < 70 && stats.questionsDone > 0 && (
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-xl">
                <h3 className="font-semibold text-gray-900">
                  Focus on Fundamentals
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your average score is {stats.avgScore}%. Try reviewing the
                  basic concepts before moving to harder topics.
                </p>
              </div>
            )}
            {stats.streak === 0 && (
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl">
                <h3 className="font-semibold text-gray-900">
                  Build a Study Habit
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start your learning streak today! Consistent practice leads to
                  better results.
                </p>
              </div>
            )}
            {stats.streak >= 3 && (
              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-xl">
                <h3 className="font-semibold text-gray-900">
                  Great Momentum! 🔥
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You&apos;re on a {stats.streak}-day streak! Keep it going to
                  unlock achievements.
                </p>
              </div>
            )}
            {stats.questionsDone === 0 && (
              <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-xl">
                <h3 className="font-semibold text-gray-900">Get Started</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Begin your learning journey by trying some practice questions
                  or exploring the study guide.
                </p>
              </div>
            )}
            {stats.avgScore >= 80 && stats.questionsDone > 10 && (
              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-xl">
                <h3 className="font-semibold text-gray-900">
                  Excellent Performance! 🌟
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your {stats.avgScore}% average is impressive! Try harder
                  difficulty levels for an extra challenge.
                </p>
              </div>
            )}
            <div className="p-4 border-l-4 border-gray-300 bg-gray-50 rounded-r-xl">
              <h3 className="font-semibold text-gray-900">Use iProf Tutor</h3>
              <p className="text-sm text-gray-600 mt-1">
                Stuck on a concept? Ask our AI tutor for personalized
                explanations and guidance.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Tutor CTA */}
      <Card className="p-6 bg-linear-to-r from-[#0794d4] to-[#0679b0] text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Need Help? Ask iProf Tutor!</h3>
              <p className="text-white/80 text-sm mt-1">
                Get instant answers and explanations from our AI tutor
              </p>
            </div>
          </div>
          <Link href="/student/iprof-tutor">
            <Button
              size="lg"
              className="bg-white text-[#0794d4] hover:bg-white/90 font-semibold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Chat
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
