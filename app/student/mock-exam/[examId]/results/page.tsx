"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  Target,
  BookOpen,
  AlertCircle,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  question: string;
  options: Record<string, string> | null;
  correct_answer: string;
  answer_key: string;
  marks: number;
  topic: string;
  difficulty: string;
  explanation: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  marksObtained: number;
  graderFeedback: string | null;
}

interface Session {
  id: string;
  total_marks_obtained: number;
  percentage: number;
  grade: string;
  objective_score: number;
  subjective_score: number;
  subjective_graded: boolean;
  submitted_at: string;
  exam: {
    id: string;
    title: string;
    subject: string;
    total_marks: number;
    passing_marks: number;
    exam_type: string;
  };
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"summary" | "review">("summary");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // First get user's session for this exam
        const listResponse = await fetch("/api/mock-exam");
        const listData = await listResponse.json();

        const exam = listData.exams?.find((e: any) => e.id === examId);
        if (!exam?.session) {
          toast.error("No submission found for this exam");
          router.push("/student/mock-exam");
          return;
        }

        // Get detailed results
        const response = await fetch(
          `/api/mock-exam?sessionId=${exam.session.exam_id}&action=results`
        );

        // Try alternative approach - get session by querying with exam info
        const sessionsResponse = await fetch(`/api/mock-exam`);
        const sessionsData = await sessionsResponse.json();
        const targetExam = sessionsData.exams?.find(
          (e: any) => e.id === examId
        );

        if (!targetExam?.session) {
          toast.error("Results not found");
          router.push("/student/mock-exam");
          return;
        }

        // Fetch full session details
        const resultsResponse = await fetch(
          `/api/mock-exam?examId=${examId}&action=start`
        );
        const resultsData = await resultsResponse.json();

        if (resultsData.session?.is_submitted) {
          // Build session from available data
          const sessionInfo: Session = {
            id: resultsData.session.id,
            total_marks_obtained: resultsData.session.total_marks_obtained || 0,
            percentage: resultsData.session.percentage || 0,
            grade: resultsData.session.grade || "N/A",
            objective_score: resultsData.session.objective_score || 0,
            subjective_score: resultsData.session.subjective_score || 0,
            subjective_graded: resultsData.session.subjective_graded || false,
            submitted_at: resultsData.session.submitted_at,
            exam: {
              id: examId,
              title: resultsData.exam?.title || targetExam.title,
              subject: resultsData.exam?.subject || targetExam.subject,
              total_marks:
                resultsData.exam?.total_marks || targetExam.total_marks,
              passing_marks:
                resultsData.exam?.passing_marks || targetExam.passing_marks,
              exam_type: resultsData.exam?.exam_type || targetExam.exam_type,
            },
          };
          setSession(sessionInfo);

          // Get questions with results
          const detailResponse = await fetch(
            `/api/mock-exam?sessionId=${resultsData.session.id}&action=results`
          );
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            setQuestions(detailData.questions || []);
          }
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">
          Results Not Available
        </h3>
        <p className="text-gray-500 mb-4">
          We couldn't find results for this exam.
        </p>
        <Link href="/student/mock-exam">
          <Button>Back to Exams</Button>
        </Link>
      </Card>
    );
  }

  const passed =
    session.percentage >=
    (session.exam.passing_marks / session.exam.total_marks) * 100;
  const correctCount = questions.filter((q) => q.isCorrect === true).length;
  const incorrectCount = questions.filter((q) => q.isCorrect === false).length;
  const currentQuestion = questions[currentIndex];

  // Summary View
  if (viewMode === "summary") {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Result Header */}
        <Card
          className={`p-8 text-center ${
            passed
              ? "bg-linear-to-br from-green-50 to-green-100 border-green-200"
              : "bg-linear-to-br from-red-50 to-red-100 border-red-200"
          }`}
        >
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              passed ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {passed ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : (
              <Target className="w-10 h-10 text-white" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? "Congratulations!" : "Keep Practicing!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {passed
              ? "You have successfully passed the exam."
              : "You didn't pass this time, but don't give up!"}
          </p>

          <div className="flex items-center justify-center gap-8">
            <div>
              <p className="text-5xl font-bold text-gray-900">
                {session.percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="h-16 w-px bg-gray-300" />
            <div>
              <p
                className={`text-5xl font-bold ${
                  passed ? "text-green-600" : "text-red-600"
                }`}
              >
                {session.grade}
              </p>
              <p className="text-sm text-gray-500">Grade</p>
            </div>
          </div>
        </Card>

        {/* Exam Info */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {session.exam.title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">
                {session.total_marks_obtained.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">
                of {session.exam.total_marks} marks
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-gray-500">Correct</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-600">{incorrectCount}</p>
              <p className="text-xs text-gray-500">Incorrect</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-600">
                {questions.length - correctCount - incorrectCount}
              </p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </div>
        </Card>

        {/* Subjective Pending Notice */}
        {!session.subjective_graded && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Grading in Progress
                </h3>
                <p className="text-sm text-yellow-700">
                  Your subjective answers (essay, long answer) are pending
                  teacher review. Your final score may change.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Objective Questions
                </span>
                <span className="font-medium">
                  {session.objective_score} marks
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0794d4]"
                  style={{
                    width: `${
                      (session.objective_score / session.exam.total_marks) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            {session.subjective_score > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Subjective Questions
                  </span>
                  <span className="font-medium">
                    {session.subjective_score} marks
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${
                        (session.subjective_score / session.exam.total_marks) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/student/mock-exam" className="flex-1">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </Link>
          <Button
            onClick={() => setViewMode("review")}
            className="flex-1 bg-[#0794d4] hover:bg-[#0678ab]"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Review Answers
          </Button>
        </div>
      </div>
    );
  }

  // Review Mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Answers</h1>
          <p className="text-gray-600">{session.exam.title}</p>
        </div>
        <Button variant="outline" onClick={() => setViewMode("summary")}>
          Back to Summary
        </Button>
      </div>

      {/* Question Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                currentIndex === idx
                  ? "bg-[#0794d4] text-white"
                  : q.isCorrect === true
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : q.isCorrect === false
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </Card>

      {/* Question Review */}
      {currentQuestion && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                Question {currentQuestion.question_number}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {currentQuestion.marks} marks
              </span>
              {currentQuestion.isCorrect === true && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Correct
                </span>
              )}
              {currentQuestion.isCorrect === false && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Incorrect
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {currentQuestion.marksObtained} / {currentQuestion.marks}
            </span>
          </div>

          <p className="text-lg text-gray-900 mb-6 whitespace-pre-wrap">
            {currentQuestion.question}
          </p>

          {/* MCQ Options */}
          {currentQuestion.question_type === "multiple_choice" &&
            currentQuestion.options && (
              <div className="space-y-2 mb-6">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isUserAnswer = currentQuestion.userAnswer === key;
                  const isCorrectAnswer =
                    currentQuestion.correct_answer === key;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 ${
                        isCorrectAnswer
                          ? "border-green-500 bg-green-50"
                          : isUserAnswer
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCorrectAnswer
                              ? "bg-green-500 text-white"
                              : isUserAnswer
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {key}
                        </span>
                        <span className="flex-1">{value}</span>
                        {isCorrectAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* Other Question Types */}
          {currentQuestion.question_type !== "multiple_choice" && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">Your Answer</p>
                <p className="text-gray-900">
                  {currentQuestion.userAnswer || "(No answer provided)"}
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Correct Answer</p>
                <p className="text-gray-900">
                  {currentQuestion.correct_answer || currentQuestion.answer_key}
                </p>
              </div>
            </div>
          )}

          {/* Explanation */}
          {currentQuestion.explanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-xs text-blue-600 mb-1">Explanation</p>
              <p className="text-gray-900">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Grader Feedback */}
          {currentQuestion.graderFeedback && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
              <p className="text-xs text-purple-600 mb-1">Teacher Feedback</p>
              <p className="text-gray-900">{currentQuestion.graderFeedback}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {questions.length}
            </span>
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
