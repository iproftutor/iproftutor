"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  TrendingUp,
  BookOpen,
  Video,
  Target,
  FileCheck,
  CreditCard,
  Headphones,
  FileText,
  Image,
  BarChart3,
  Activity,
  Award,
  Loader2,
  ChevronDown,
  Flame,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TimeBySection {
  section: string;
  total_seconds: number;
  sessions: number;
}

interface LastActivity {
  section: string;
  last_activity_at: string;
}

interface ScoreEntry {
  date: string;
  avg_score?: number;
  score?: number;
  sessions?: number;
  subject?: string;
  topic?: string;
  total_questions?: number;
  correct_answers?: number;
  time_spent?: number;
}

interface OverallStats {
  total_study_time: number;
  total_practice_sessions: number;
  total_exams_taken: number;
  avg_practice_score: number;
  avg_exam_score: number;
  current_streak?: number;
  total_questions_answered?: number;
  total_correct_answers?: number;
}

interface DailyActivity {
  date: string;
  total_seconds: number;
  sessions: number;
}

interface WeeklyActivity {
  date: string;
  day: string;
  sessions: number;
  avgScore: number;
  studyTime: number;
}

interface SubjectPerformance {
  subject: string;
  avg_score: number;
  attempts: number;
  last_attempt: string;
}

interface PerformanceData {
  time_by_section: TimeBySection[];
  last_activity: LastActivity[];
  practice_scores: ScoreEntry[];
  exam_scores: ScoreEntry[];
  overall: OverallStats;
  daily_activity: DailyActivity[];
  weekly_activity?: WeeklyActivity[];
  subjects_performance: SubjectPerformance[];
}

const sectionConfig: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  study_guide: {
    label: "Study Guide",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-100",
  },
  video: { label: "Video", icon: Video, color: "text-red-600 bg-red-100" },
  practice: {
    label: "Practice",
    icon: Target,
    color: "text-green-600 bg-green-100",
  },
  mock_exam: {
    label: "Mock Exam",
    icon: FileCheck,
    color: "text-purple-600 bg-purple-100",
  },
  flashcard: {
    label: "Flashcard",
    icon: CreditCard,
    color: "text-orange-600 bg-orange-100",
  },
  notes: { label: "Notes", icon: FileText, color: "text-cyan-600 bg-cyan-100" },
  podcast: {
    label: "Podcast",
    icon: Headphones,
    color: "text-pink-600 bg-pink-100",
  },
  extra: {
    label: "Extra",
    icon: Image,
    color: "text-indigo-600 bg-indigo-100",
  },
};

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchPerformance();
  }, [timeRange]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance?days=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch performance:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTimeDetailed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins} minutes`;
    return `${hours} hours ${mins} minutes`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const getMaxTime = () => {
    if (!data?.time_by_section?.length) return 1;
    return Math.max(...data.time_by_section.map((s) => s.total_seconds));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  const overall = data?.overall || {
    total_study_time: 0,
    total_practice_sessions: 0,
    total_exams_taken: 0,
    avg_practice_score: 0,
    avg_exam_score: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
          <p className="text-gray-600 mt-1">Track your learning progress</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="px-4 py-2 border rounded-lg bg-white text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {formatTime(overall.total_study_time)}
              </p>
              <p className="text-xs text-gray-500">Total Study Time</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.total_practice_sessions}
              </p>
              <p className="text-xs text-gray-500">Practice Sessions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.total_exams_taken}
              </p>
              <p className="text-xs text-gray-500">Exams Taken</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.avg_practice_score}%
              </p>
              <p className="text-xs text-gray-500">Avg Practice Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.avg_exam_score}%
              </p>
              <p className="text-xs text-gray-500">Avg Exam Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.current_streak || 0} days
              </p>
              <p className="text-xs text-gray-500">Current Streak</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.total_questions_answered || 0}
              </p>
              <p className="text-xs text-gray-500">Questions Answered</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.total_correct_answers || 0}
              </p>
              <p className="text-xs text-gray-500">Correct Answers</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {overall.total_questions_answered &&
                overall.total_questions_answered > 0
                  ? Math.round(
                      ((overall.total_correct_answers || 0) /
                        overall.total_questions_answered) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500">Accuracy Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      {data?.weekly_activity && data.weekly_activity.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            This Week's Activity
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {data.weekly_activity.map((day) => {
              const maxSessions = Math.max(
                ...data.weekly_activity!.map((d) => d.sessions),
                1
              );
              const height =
                day.sessions > 0
                  ? Math.max(20, (day.sessions / maxSessions) * 100)
                  : 8;
              const isToday =
                day.date === new Date().toISOString().split("T")[0];

              return (
                <div key={day.date} className="flex flex-col items-center">
                  <div className="h-28 flex flex-col justify-end items-center w-full">
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                        day.sessions > 0
                          ? isToday
                            ? "bg-[#0794d4]"
                            : "bg-[#0794d4]/70"
                          : "bg-gray-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div
                    className={`mt-2 text-center ${
                      isToday ? "font-semibold text-[#0794d4]" : ""
                    }`}
                  >
                    <p className="text-xs text-gray-500">{day.day}</p>
                    <p className="text-sm font-medium">{day.sessions}</p>
                    {day.avgScore > 0 && (
                      <p className="text-xs text-green-600">{day.avgScore}%</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#0794d4]" />
              <span>Sessions completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">%</span>
              <span>Average score</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Time Spent Per Section */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Time Spent Per Section
          </h2>

          {data?.time_by_section && data.time_by_section.length > 0 ? (
            <div className="space-y-4">
              {data.time_by_section
                .sort((a, b) => b.total_seconds - a.total_seconds)
                .map((section) => {
                  const config = sectionConfig[section.section] || {
                    label: section.section,
                    icon: Activity,
                    color: "text-gray-600 bg-gray-100",
                  };
                  const Icon = config.icon;
                  const percentage =
                    (section.total_seconds / getMaxTime()) * 100;

                  return (
                    <div key={section.section}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {config.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTime(section.total_seconds)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({section.sessions} sessions)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0794d4] transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activity data yet</p>
              <p className="text-sm">
                Start studying to see your time breakdown
              </p>
            </div>
          )}
        </Card>

        {/* Last Activity Per Section */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Last Activity
          </h2>

          {data?.last_activity && data.last_activity.length > 0 ? (
            <div className="space-y-3">
              {data.last_activity.map((activity) => {
                const config = sectionConfig[activity.section] || {
                  label: activity.section,
                  icon: Activity,
                  color: "text-gray-600 bg-gray-100",
                };
                const Icon = config.icon;

                return (
                  <div
                    key={activity.section}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatRelativeDate(activity.last_activity_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activity recorded</p>
              <p className="text-sm">Your recent activity will appear here</p>
            </div>
          )}
        </Card>
      </div>

      {/* Score Tracking */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          Score Tracking
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Practice Scores */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Practice Scores ({data?.practice_scores?.length || 0} sessions)
            </h3>

            {data?.practice_scores && data.practice_scores.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.practice_scores.slice(0, 15).map((score, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(score.date)}
                        </span>
                        {score.topic && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {score.topic}
                          </span>
                        )}
                      </div>
                      {score.total_questions && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {score.correct_answers || 0}/{score.total_questions}{" "}
                          correct
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            (score.avg_score || score.score || 0) >= 70
                              ? "bg-green-500"
                              : (score.avg_score || score.score || 0) >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${score.avg_score || score.score || 0}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-sm font-bold w-12 text-right ${
                          (score.avg_score || score.score || 0) >= 70
                            ? "text-green-600"
                            : (score.avg_score || score.score || 0) >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {(score.avg_score || score.score || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No practice scores yet</p>
                <p className="text-sm mt-1">
                  Complete practice sessions to see your scores
                </p>
              </div>
            )}
          </div>

          {/* Exam Scores */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              Exam Scores ({data?.exam_scores?.length || 0} exams)
            </h3>

            {data?.exam_scores && data.exam_scores.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.exam_scores.slice(0, 15).map((score, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(score.date)}
                        </span>
                        {score.subject && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {score.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            (score.score || 0) >= 70
                              ? "bg-green-500"
                              : (score.score || 0) >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${score.score || 0}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-bold w-12 text-right ${
                          (score.score || 0) >= 70
                            ? "text-green-600"
                            : (score.score || 0) >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {(score.score || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <FileCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No exam scores yet</p>
                <p className="text-sm mt-1">
                  Complete mock exams to see your scores
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Study Time Chart */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          Study Time Distribution
        </h2>

        {data?.daily_activity && data.daily_activity.length > 0 ? (
          <div className="flex items-end justify-between gap-2 h-40">
            {(() => {
              // Get last 7 days
              const days = [];
              for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0];
                const activity = data.daily_activity.find(
                  (d) => d.date === dateStr
                );
                days.push({
                  date: dateStr,
                  day: date.toLocaleDateString("en-US", { weekday: "short" }),
                  total_seconds: activity?.total_seconds || 0,
                });
              }

              const maxSeconds = Math.max(
                ...days.map((d) => d.total_seconds),
                1
              );

              return days.map((day) => {
                const height = (day.total_seconds / maxSeconds) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      {day.total_seconds > 0 && (
                        <span className="text-xs text-gray-500 mb-1">
                          {formatTime(day.total_seconds)}
                        </span>
                      )}
                      <div
                        className={`w-full max-w-12 rounded-t-lg transition-all ${
                          day.total_seconds > 0 ? "bg-[#0794d4]" : "bg-gray-200"
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                      {day.day}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No weekly data yet</p>
            <p className="text-sm">Your daily activity will appear here</p>
          </div>
        )}
      </Card>

      {/* Subject Performance */}
      {data?.subjects_performance && data.subjects_performance.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-500" />
            Performance by Subject
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.subjects_performance.map((subject) => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {subject.subject}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      subject.avg_score >= 70
                        ? "text-green-600"
                        : subject.avg_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {subject.avg_score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${
                      subject.avg_score >= 70
                        ? "bg-green-500"
                        : subject.avg_score >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${subject.avg_score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{subject.attempts} attempts</span>
                  <span>Last: {formatRelativeDate(subject.last_attempt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
