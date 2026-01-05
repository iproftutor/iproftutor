"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  BookOpen,
  Target,
  TrendingDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface MistakeLog {
  id: string;
  source_type: "practice" | "exam";
  question_text: string;
  question_type: string;
  user_answer: string;
  correct_answer: string;
  explanation: string | null;
  subject: string | null;
  topic: string | null;
  tags: string[];
  difficulty: string | null;
  time_spent_seconds: number;
  created_at: string;
  reviewed_at: string | null;
  is_resolved: boolean;
}

interface Stats {
  total_mistakes: number;
  practice_mistakes: number;
  exam_mistakes: number;
  resolved_count: number;
  unresolved_count: number;
  top_subjects: { subject: string; count: number }[];
  recent_mistakes: any[];
  mistakes_by_day: { date: string; count: number }[];
}

export default function MistakeLogPage() {
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [resolvedFilter, setResolvedFilter] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [selectedMistake, setSelectedMistake] = useState<MistakeLog | null>(
    null
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/mistakes?stats=true");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchMistakes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (sourceFilter) params.set("sourceType", sourceFilter);
      if (subjectFilter) params.set("subject", subjectFilter);
      if (resolvedFilter) params.set("resolved", resolvedFilter);

      const response = await fetch(`/api/mistakes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMistakes(data.mistakes);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Failed to fetch mistakes:", error);
      toast.error("Failed to load mistakes");
    } finally {
      setLoading(false);
    }
  }, [page, sourceFilter, subjectFilter, resolvedFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  const handleMarkResolved = async (mistakeId: string, resolved: boolean) => {
    try {
      const response = await fetch("/api/mistakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mistakeId,
          isResolved: resolved,
          reviewedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success(
          resolved ? "Marked as understood" : "Marked as unresolved"
        );
        fetchMistakes();
        fetchStats();
        if (selectedMistake?.id === mistakeId) {
          setSelectedMistake((prev) =>
            prev ? { ...prev, is_resolved: resolved } : null
          );
        }
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mistake Log</h1>
        <p className="text-gray-600 mt-1">
          Track and review your mistakes to improve
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_mistakes || 0}
              </p>
              <p className="text-xs text-gray-500">Total Mistakes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.practice_mistakes || 0}
              </p>
              <p className="text-xs text-gray-500">From Practice</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.exam_mistakes || 0}
              </p>
              <p className="text-xs text-gray-500">From Exams</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.resolved_count || 0}
              </p>
              <p className="text-xs text-gray-500">Understood</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.unresolved_count || 0}
              </p>
              <p className="text-xs text-gray-500">Need Review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Subjects */}
      {stats?.top_subjects && stats.top_subjects.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Subjects with Most Mistakes
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_subjects.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
              >
                {item.subject}: {item.count}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Sources</option>
            <option value="practice">Practice (Red)</option>
            <option value="exam">Exam (Yellow)</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={resolvedFilter}
            onChange={(e) => {
              setResolvedFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          >
            <option value="">All Status</option>
            <option value="false">Need Review</option>
            <option value="true">Understood</option>
          </select>

          {(sourceFilter || subjectFilter || resolvedFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceFilter("");
                setSubjectFilter("");
                setResolvedFilter("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Mistakes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
        </div>
      ) : mistakes.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">
            No Mistakes Found
          </h3>
          <p className="text-gray-500">
            {sourceFilter || subjectFilter || resolvedFilter
              ? "Try adjusting your filters"
              : "Great job! Keep practicing to maintain your streak."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <Card
              key={mistake.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                mistake.source_type === "practice"
                  ? "border-l-red-500"
                  : "border-l-yellow-500"
              }`}
              onClick={() => setSelectedMistake(mistake)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        mistake.source_type === "practice"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {mistake.source_type === "practice" ? "Practice" : "Exam"}
                    </span>
                    {mistake.subject && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {mistake.subject}
                      </span>
                    )}
                    {mistake.difficulty && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          mistake.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : mistake.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {mistake.difficulty}
                      </span>
                    )}
                    {mistake.is_resolved && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-900 line-clamp-2">
                    {mistake.question_text}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(mistake.created_at)}
                    </span>
                    {mistake.time_spent_seconds > 0 && (
                      <span>
                        Time: {formatTime(mistake.time_spent_seconds)}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of{" "}
                {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedMistake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    selectedMistake.source_type === "practice"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedMistake.source_type === "practice"
                    ? "Practice"
                    : "Exam"}
                </span>
                {selectedMistake.subject && (
                  <span className="text-gray-500">
                    • {selectedMistake.subject}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedMistake(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Question */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Question
                </h3>
                <p className="text-gray-900">{selectedMistake.question_text}</p>
              </div>

              {/* Your Answer */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-700 mb-2">
                  Your Answer (Incorrect)
                </h3>
                <p className="text-red-900">{selectedMistake.user_answer}</p>
              </div>

              {/* Correct Answer */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-medium text-green-700 mb-2">
                  Correct Answer
                </h3>
                <p className="text-green-900">
                  {selectedMistake.correct_answer}
                </p>
              </div>

              {/* Explanation */}
              {selectedMistake.explanation && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">
                    Explanation
                  </h3>
                  <p className="text-blue-900">{selectedMistake.explanation}</p>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {formatDate(selectedMistake.created_at)}
                </span>
                {selectedMistake.time_spent_seconds > 0 && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                    Time: {formatTime(selectedMistake.time_spent_seconds)}
                  </span>
                )}
                {selectedMistake.difficulty && (
                  <span
                    className={`px-2 py-1 rounded ${
                      selectedMistake.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : selectedMistake.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedMistake.difficulty}
                  </span>
                )}
                {selectedMistake.tags?.length > 0 &&
                  selectedMistake.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedMistake(null)}
              >
                Close
              </Button>
              <Button
                onClick={() =>
                  handleMarkResolved(
                    selectedMistake.id,
                    !selectedMistake.is_resolved
                  )
                }
                className={
                  selectedMistake.is_resolved
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-green-500 hover:bg-green-600"
                }
              >
                {selectedMistake.is_resolved ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Mark for Review
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Understood
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
