"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  FileCheck,
  Calendar,
  BookOpen,
  Trophy,
  AlertCircle,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Exam {
  id: string;
  title: string;
  description: string;
  exam_type: "mid_year" | "end_year" | "custom";
  subject: string;
  grade_level: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  session: {
    is_completed: boolean;
    is_submitted: boolean;
    percentage: number;
    grade: string;
    submitted_at: string;
  } | null;
}

export default function MockExamListPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mock-exam");
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "mid_year":
        return "Mid Year";
      case "end_year":
        return "End Year";
      default:
        return "Custom";
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "mid_year":
        return "bg-blue-100 text-blue-700";
      case "end_year":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (exam: Exam) => {
    if (!exam.session) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
          Not Started
        </span>
      );
    }
    if (exam.session.is_submitted) {
      const passed =
        exam.session.percentage >=
        (exam.passing_marks / exam.total_marks) * 100;
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {passed ? "Passed" : "Failed"} - {exam.session.grade}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
        In Progress
      </span>
    );
  };

  const isExamAvailable = (exam: Exam) => {
    const now = new Date();
    if (exam.start_date && new Date(exam.start_date) > now) return false;
    if (exam.end_date && new Date(exam.end_date) < now) return false;
    return true;
  };

  const filteredExams = exams.filter((exam) => {
    if (filter === "all") return true;
    if (filter === "available")
      return !exam.session?.is_submitted && isExamAvailable(exam);
    if (filter === "completed") return exam.session?.is_submitted;
    if (filter === "mid_year") return exam.exam_type === "mid_year";
    if (filter === "end_year") return exam.exam_type === "end_year";
    return true;
  });

  const stats = {
    total: exams.length,
    completed: exams.filter((e) => e.session?.is_submitted).length,
    passed: exams.filter(
      (e) =>
        e.session?.is_submitted &&
        e.session.percentage >= (e.passing_marks / e.total_marks) * 100
    ).length,
    avgScore:
      exams.filter((e) => e.session?.is_submitted).length > 0
        ? Math.round(
            exams
              .filter((e) => e.session?.is_submitted)
              .reduce((acc, e) => acc + (e.session?.percentage || 0), 0) /
              exams.filter((e) => e.session?.is_submitted).length
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mock Exams</h1>
        <p className="text-gray-600 mt-1">
          Test your knowledge with timed examinations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Exams</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.passed}</p>
              <p className="text-xs text-gray-500">Passed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Timer className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgScore}%
              </p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Exams" },
          { key: "available", label: "Available" },
          { key: "completed", label: "Completed" },
          { key: "mid_year", label: "Mid Year" },
          { key: "end_year", label: "End Year" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-[#0794d4] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Exam List */}
      {filteredExams.length === 0 ? (
        <Card className="p-12 text-center">
          <FileCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "No exams are currently available."
              : "No exams match your filter."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className={`p-6 hover:shadow-md transition-shadow ${
                !isExamAvailable(exam) ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getExamTypeColor(
                        exam.exam_type
                      )}`}
                    >
                      {getExamTypeLabel(exam.exam_type)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {exam.subject}
                    </span>
                    {getStatusBadge(exam)}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exam.duration_minutes} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {exam.total_marks} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      Pass: {exam.passing_marks} marks
                    </span>
                    {exam.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due:{" "}
                        {new Date(exam.end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {exam.session?.is_submitted && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">
                          Score: {exam.session.percentage.toFixed(1)}%
                        </span>
                        <span className="font-medium text-gray-700">
                          Grade: {exam.session.grade}
                        </span>
                        <span className="text-gray-500">
                          Submitted:{" "}
                          {new Date(
                            exam.session.submitted_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {exam.session?.is_submitted ? (
                    <Link href={`/student/mock-exam/${exam.id}/results`}>
                      <Button variant="outline" className="w-full">
                        View Results
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : exam.session && !exam.session.is_submitted ? (
                    <Link href={`/student/mock-exam/${exam.id}/take`}>
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600">
                        Continue Exam
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : isExamAvailable(exam) ? (
                    <Link href={`/student/mock-exam/${exam.id}/take`}>
                      <Button className="w-full bg-[#0794d4] hover:bg-[#0678ab]">
                        Start Exam
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Not Available
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
