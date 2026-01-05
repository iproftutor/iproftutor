"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  Flag,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  question: string;
  options: Record<string, string> | null;
  marks: number;
  topic: string;
  difficulty: string;
  userAnswer?: string | null;
  isAnswered?: boolean;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  instructions: string;
  exam_type: string;
}

interface Session {
  id: string;
  time_remaining_seconds: number;
  started_at: string;
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(
          `/api/mock-exam?examId=${examId}&action=start`
        );
        const data = await response.json();

        if (!response.ok) {
          if (data.session?.is_submitted) {
            router.push(`/student/mock-exam/${examId}/results`);
            return;
          }
          toast.error(data.error);
          router.push("/student/mock-exam");
          return;
        }

        setExam(data.exam);
        setQuestions(data.questions || []);

        // Check for existing session
        if (data.existingSession) {
          setSession(data.existingSession);
          setTimeRemaining(data.existingSession.time_remaining_seconds);
          setShowInstructions(false);

          // Load existing answers
          const sessionResponse = await fetch(
            `/api/mock-exam?sessionId=${data.existingSession.id}&action=session`
          );
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            const existingAnswers: Record<string, string> = {};
            sessionData.questions?.forEach((q: any) => {
              if (q.userAnswer) {
                existingAnswers[q.id] = q.userAnswer;
              }
            });
            setAnswers(existingAnswers);
          }
        } else {
          setTimeRemaining(data.exam.duration_minutes * 60);
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast.error("Failed to load exam");
        router.push("/student/mock-exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, router]);

  // Timer
  useEffect(() => {
    if (!session || showInstructions) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit(true);
          return 0;
        }
        if (prev === 300) {
          setShowTimeWarning(true);
          toast.warning("5 minutes remaining!");
        }
        if (prev === 60) {
          toast.error("1 minute remaining!");
        }
        return prev - 1;
      });
    }, 1000);

    // Save time to server every 30 seconds
    saveTimeRef.current = setInterval(() => {
      fetch("/api/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_time",
          sessionId: session.id,
          timeRemaining: timeRemaining,
        }),
      });
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimeRef.current) clearInterval(saveTimeRef.current);
    };
  }, [session, showInstructions]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startExam = async () => {
    try {
      const response = await fetch("/api/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", examId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      setSession(data.session);
      setTimeRemaining(data.session.time_remaining_seconds);
      setShowInstructions(false);

      if (data.resumed) {
        toast.info("Resuming your previous attempt");
      }
    } catch (error) {
      toast.error("Failed to start exam");
    }
  };

  const saveAnswer = async (questionId: string, answer: string) => {
    if (!session) return;

    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    try {
      await fetch("/api/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_answer",
          sessionId: session.id,
          questionId,
          answer,
        }),
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!session) return;

    if (!autoSubmit) {
      const unanswered = questions.filter((q) => !answers[q.id]).length;
      if (unanswered > 0 && !showSubmitConfirm) {
        setShowSubmitConfirm(true);
        return;
      }
    }

    setSubmitting(true);
    setShowSubmitConfirm(false);

    try {
      // Prepare all answers
      const answersArray = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      const response = await fetch("/api/mock-exam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          answers: answersArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(
        autoSubmit
          ? "Time's up! Exam submitted."
          : "Exam submitted successfully!"
      );
      router.push(`/student/mock-exam/${examId}/results`);
    } catch (error) {
      toast.error("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  // Instructions Screen
  if (showInstructions && exam) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0794d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-[#0794d4]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {exam.title}
            </h1>
            <p className="text-gray-600">{exam.subject}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {questions.length}
              </p>
              <p className="text-sm text-gray-500">Questions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {exam.duration_minutes}
              </p>
              <p className="text-sm text-gray-500">Minutes</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {exam.total_marks}
              </p>
              <p className="text-sm text-gray-500">Total Marks</p>
            </div>
          </div>

          {exam.instructions && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {exam.instructions}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-8">
            <h3 className="font-semibold text-gray-900">Important Notes</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                The timer will start once you begin the exam
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                You can navigate between questions using the navigation panel
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                Your answers are automatically saved as you progress
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                The exam will auto-submit when time runs out
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/student/mock-exam")}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={startExam}
              className="flex-1 bg-[#0794d4] hover:bg-[#0678ab]"
            >
              Start Exam
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)]">
      {/* Main Content */}
      <div className="flex-1">
        {/* Timer Bar */}
        <div
          className={`sticky top-0 z-10 p-4 mb-4 rounded-lg ${
            timeRemaining <= 300
              ? "bg-red-500 text-white"
              : "bg-white border shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-5 h-5 ${
                    timeRemaining <= 300 ? "text-white" : "text-gray-600"
                  }`}
                />
                <span
                  className={`text-xl font-mono font-bold ${
                    timeRemaining <= 300 ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span
                className={`text-sm ${
                  timeRemaining <= 300 ? "text-white/80" : "text-gray-500"
                }`}
              >
                {answeredCount} of {questions.length} answered
              </span>
            </div>

            <Button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className={
                timeRemaining <= 300
                  ? "bg-white text-red-500 hover:bg-gray-100"
                  : "bg-green-500 hover:bg-green-600"
              }
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Exam
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0794d4] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-[#0794d4]/10 text-[#0794d4] rounded text-sm font-medium">
                    Question {currentQuestion.question_number}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {currentQuestion.marks} mark
                    {currentQuestion.marks > 1 ? "s" : ""}
                  </span>
                  {currentQuestion.difficulty && (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        currentQuestion.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : currentQuestion.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={
                  flagged.has(currentQuestion.id) ? "text-orange-500" : ""
                }
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-8">
              <p className="text-lg text-gray-900 whitespace-pre-wrap">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Input */}
            {currentQuestion.question_type === "multiple_choice" &&
              currentQuestion.options && (
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(
                    ([key, value]) => (
                      <button
                        key={key}
                        onClick={() => saveAnswer(currentQuestion.id, key)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          answers[currentQuestion.id] === key
                            ? "border-[#0794d4] bg-[#0794d4]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                              answers[currentQuestion.id] === key
                                ? "bg-[#0794d4] text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {key}
                          </span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}

            {currentQuestion.question_type === "true_false" && (
              <div className="flex gap-4">
                {["True", "False"].map((option) => (
                  <button
                    key={option}
                    onClick={() => saveAnswer(currentQuestion.id, option)}
                    className={`flex-1 p-4 text-center rounded-lg border-2 transition-all ${
                      answers[currentQuestion.id] === option
                        ? "border-[#0794d4] bg-[#0794d4]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        answers[currentQuestion.id] === option
                          ? "text-[#0794d4]"
                          : "text-gray-900"
                      }`}
                    >
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.question_type === "fill_blank" ||
              currentQuestion.question_type === "short_answer") && (
              <input
                type="text"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-[#0794d4] focus:outline-none"
              />
            )}

            {(currentQuestion.question_type === "long_answer" ||
              currentQuestion.question_type === "essay") && (
              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer..."
                rows={8}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-[#0794d4] focus:outline-none resize-none"
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
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

      {/* Question Navigator */}
      <div className="lg:w-72">
        <Card className="p-4 sticky top-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Question Navigator
          </h3>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                  currentIndex === idx
                    ? "bg-[#0794d4] text-white"
                    : answers[q.id]
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {idx + 1}
                {flagged.has(q.id) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-gray-600">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <span className="text-gray-600">
                Not Answered ({questions.length - answeredCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </div>
              <span className="text-gray-600">Flagged ({flagged.size})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Submit Exam?
              </h3>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              {questions.length - answeredCount > 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-800">
                      You have{" "}
                      <strong>
                        {questions.length - answeredCount} unanswered
                      </strong>{" "}
                      question(s). Are you sure you want to submit?
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  You have answered all questions. Ready to submit?
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Answered: {answeredCount}</span>
                <span>Unanswered: {questions.length - answeredCount}</span>
                <span>Flagged: {flagged.size}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1"
              >
                Continue Exam
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
