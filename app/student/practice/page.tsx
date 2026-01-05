"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Target,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
  Play,
  RotateCcw,
  AlertCircle,
  Zap,
  BookOpen,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
}

interface Question {
  id: string;
  question: string;
  question_type:
    | "multiple_choice"
    | "true_false"
    | "fill_blank"
    | "short_answer";
  difficulty: "easy" | "medium" | "hard";
  options?: { label: string; text: string }[];
}

interface AnswerRecord {
  questionId: string;
  answer: string;
  timeSpent: number;
}

interface QuestionResult {
  questionId: string;
  question: string;
  question_type: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  options?: { label: string; text: string }[];
}

interface Session {
  id: string;
  topic_id: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string;
  practice_topics?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface Limits {
  can_practice: boolean;
  questions_remaining_today: number;
  questions_remaining_month: number;
  is_paid_user: boolean;
  daily_limit: number;
  monthly_limit: number;
}

interface Stats {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number;
}

type ViewMode = "topics" | "practice" | "results";

export default function PracticePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Practice session state
  const [viewMode, setViewMode] = useState<ViewMode>("topics");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");
  const [questionCount, setQuestionCount] = useState(5); // Default 5 questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch answer collection
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [answerTimes, setAnswerTimes] = useState<Record<string, number>>({});

  // Results state
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [sessionResults, setSessionResults] = useState<{
    correct: number;
    total: number;
    score: number;
    timeSpent: number;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/practice");
      if (!response.ok) throw new Error("Failed to fetch practice data");

      const data = await response.json();
      setTopics(data.topics || []);
      setLimits(data.limits);
      setRecentSessions(data.recentSessions || []);
      setStats(data.stats);
    } catch (error: any) {
      toast.error("Failed to load practice data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startPractice = async (topic: Topic) => {
    if (!limits?.can_practice) {
      toast.error("You've reached your practice limit. Upgrade to continue!");
      return;
    }

    setSelectedTopic(topic);
    setIsGenerating(true);

    // Show generating state if no questions exist yet
    if (topic.questionCount === 0) {
      toast.info("Generating questions from study guide...");
    }

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          studyGuideId: topic.id,
          difficulty: selectedDifficulty,
          questionCount: questionCount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start practice");
      }

      const data = await response.json();
      setSessionId(data.session.id);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setQuestionStartTime(Date.now());
      setUserAnswers({});
      setAnswerTimes({});
      setViewMode("practice");

      // Show success message
      toast.success(`${data.questions.length} questions ready!`);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save current answer and move to next question
  const saveAnswerAndNext = () => {
    const question = questions[currentQuestionIndex];
    const answer =
      question.question_type === "multiple_choice" ||
      question.question_type === "true_false"
        ? selectedOption
        : userAnswer;

    if (!answer) {
      toast.error("Please provide an answer");
      return;
    }

    // Save the answer
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setUserAnswers((prev) => ({ ...prev, [question.id]: answer }));
    setAnswerTimes((prev) => ({ ...prev, [question.id]: timeSpent }));

    // Reset for next question
    setUserAnswer("");
    setSelectedOption(null);
    setQuestionStartTime(Date.now());

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, submit all at once
      submitAllAnswers(
        { ...userAnswers, [question.id]: answer },
        { ...answerTimes, [question.id]: timeSpent }
      );
    }
  };

  // Submit all answers at once
  const submitAllAnswers = async (
    answers: Record<string, string>,
    times: Record<string, number>
  ) => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_all",
          sessionId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
            timeSpent: times[questionId] || 0,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit answers");
      }

      const data = await response.json();
      setQuestionResults(data.results);
      setSessionResults(data.stats);
      setViewMode("results");
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer before going back
      const question = questions[currentQuestionIndex];
      const answer =
        question.question_type === "multiple_choice" ||
        question.question_type === "true_false"
          ? selectedOption
          : userAnswer;

      if (answer) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        setUserAnswers((prev) => ({ ...prev, [question.id]: answer }));
        setAnswerTimes((prev) => ({ ...prev, [question.id]: timeSpent }));
      }

      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Restore previous answer
      const prevQuestion = questions[currentQuestionIndex - 1];
      const prevAnswer = userAnswers[prevQuestion.id] || "";
      if (
        prevQuestion.question_type === "multiple_choice" ||
        prevQuestion.question_type === "true_false"
      ) {
        setSelectedOption(prevAnswer);
        setUserAnswer("");
      } else {
        setUserAnswer(prevAnswer);
        setSelectedOption(null);
      }
      setQuestionStartTime(Date.now());
    }
  };

  const resetPractice = () => {
    setViewMode("topics");
    setSelectedTopic(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSessionId(null);
    setUserAnswer("");
    setSelectedOption(null);
    setUserAnswers({});
    setAnswerTimes({});
    setQuestionResults([]);
    setSessionResults(null);
    fetchData();
  };

  const renderTopicCard = (topic: Topic) => (
    <Card
      key={topic.id}
      className={`p-5 hover:shadow-md transition-all border-l-4`}
      style={{ borderLeftColor: topic.color }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${topic.color}20` }}
        >
          {topic.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{topic.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {topic.description}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Button
              size="sm"
              className="bg-[#0794d4] hover:bg-[#0680bc] text-white text-xs"
              disabled={!limits?.can_practice}
              onClick={() => startPractice(topic)}
            >
              <Play className="w-3 h-3 mr-1" />
              Start Practice
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const difficultyColors = {
      easy: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      hard: "bg-red-100 text-red-700",
    };

    const currentAnswer =
      userAnswers[question.id] ||
      (question.question_type === "multiple_choice" ||
      question.question_type === "true_false"
        ? selectedOption
        : userAnswer);

    return (
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                difficultyColors[question.difficulty]
              }`}
            >
              {question.difficulty}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPractice}
            className="text-gray-500"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Exit
          </Button>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#0794d4] h-2 rounded-full transition-all"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / questions.length) * 100
              }%`,
            }}
          />
        </div>

        {/* Question indicators */}
        <div className="flex gap-2 flex-wrap">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                // Save current answer before switching
                const currQ = questions[currentQuestionIndex];
                const currAns =
                  currQ.question_type === "multiple_choice" ||
                  currQ.question_type === "true_false"
                    ? selectedOption
                    : userAnswer;
                if (currAns) {
                  const timeSpent = Math.floor(
                    (Date.now() - questionStartTime) / 1000
                  );
                  setUserAnswers((prev) => ({ ...prev, [currQ.id]: currAns }));
                  setAnswerTimes((prev) => ({
                    ...prev,
                    [currQ.id]: timeSpent,
                  }));
                }

                // Switch to new question
                setCurrentQuestionIndex(idx);
                const prevAnswer = userAnswers[q.id] || "";
                if (
                  q.question_type === "multiple_choice" ||
                  q.question_type === "true_false"
                ) {
                  setSelectedOption(prevAnswer);
                  setUserAnswer("");
                } else {
                  setUserAnswer(prevAnswer);
                  setSelectedOption(null);
                }
                setQuestionStartTime(Date.now());
              }}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                idx === currentQuestionIndex
                  ? "bg-[#0794d4] text-white"
                  : userAnswers[q.id]
                  ? "bg-green-100 text-green-700 border-2 border-green-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${selectedTopic?.color}20` }}
            >
              {selectedTopic?.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{selectedTopic?.name}</p>
              <p className="text-xs text-gray-400">
                {question.question_type.replace("_", " ")}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {question.question}
          </h2>

          {/* Answer input based on question type */}
          {question.question_type === "multiple_choice" && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedOption(option.label)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOption === option.label
                      ? "border-[#0794d4] bg-[#0794d4]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold mr-2">{option.label}.</span>
                  {option.text}
                </button>
              ))}
            </div>
          )}

          {question.question_type === "true_false" && (
            <div className="flex gap-4">
              {["true", "false"].map((value) => (
                <button
                  key={value}
                  onClick={() => setSelectedOption(value)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all capitalize font-medium ${
                    selectedOption === value
                      ? "border-[#0794d4] bg-[#0794d4]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          {(question.question_type === "fill_blank" ||
            question.question_type === "short_answer") && (
            <div>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  question.question_type === "fill_blank"
                    ? "Fill in the blank..."
                    : "Type your answer..."
                }
                className="w-full p-4 rounded-lg border-2 text-gray-900 placeholder:text-gray-400 border-gray-200 focus:border-[#0794d4] focus:ring-2 focus:ring-[#0794d4]/20"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={saveAnswerAndNext}
              disabled={isSubmitting || (!selectedOption && !userAnswer)}
              className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Submit All
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderResults = () => {
    if (!sessionResults) return null;

    const percentage = sessionResults.score.toFixed(0);
    const isPassing = sessionResults.score >= 70;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Summary Card */}
        <Card className="p-8 text-center">
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isPassing ? "bg-green-100" : "bg-orange-100"
            }`}
          >
            {isPassing ? (
              <Trophy className="w-12 h-12 text-green-600" />
            ) : (
              <Target className="w-12 h-12 text-orange-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isPassing ? "Great Job!" : "Keep Practicing!"}
          </h2>
          <p className="text-gray-500 mb-6">
            You completed the {selectedTopic?.name} practice session
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-[#0794d4]">{percentage}%</p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {sessionResults.correct}/{sessionResults.total}
              </p>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-700">
                {Math.floor(sessionResults.timeSpent / 60)}:
                {String(sessionResults.timeSpent % 60).padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-500">Time</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetPractice}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Topics
            </Button>
            <Button
              onClick={() => selectedTopic && startPractice(selectedTopic)}
              className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>

        {/* Question Results */}
        {questionResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Question Review
            </h3>
            <div className="space-y-4">
              {questionResults.map((result, idx) => (
                <Card
                  key={result.questionId}
                  className={`p-5 border-l-4 ${
                    result.isCorrect ? "border-l-green-500" : "border-l-red-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        Question {idx + 1}
                      </p>
                      <p className="font-medium text-gray-900 mb-3">
                        {result.question}
                      </p>

                      {/* Show options for multiple choice */}
                      {result.question_type === "multiple_choice" &&
                        result.options && (
                          <div className="space-y-2 mb-3">
                            {result.options.map((opt) => (
                              <div
                                key={opt.label}
                                className={`text-sm p-2 rounded ${
                                  opt.label === result.correctAnswer
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : opt.label === result.userAnswer &&
                                      !result.isCorrect
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "text-gray-600"
                                }`}
                              >
                                <span className="font-medium">
                                  {opt.label}.
                                </span>{" "}
                                {opt.text}
                                {opt.label === result.correctAnswer && (
                                  <span className="ml-2 text-green-600">✓</span>
                                )}
                                {opt.label === result.userAnswer &&
                                  !result.isCorrect && (
                                    <span className="ml-2 text-red-600">
                                      (Your answer)
                                    </span>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Show answer for other types */}
                      {result.question_type !== "multiple_choice" && (
                        <div className="text-sm space-y-1 mb-3">
                          <p>
                            <span className="text-gray-500">Your answer:</span>{" "}
                            <span
                              className={
                                result.isCorrect
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {result.userAnswer}
                            </span>
                          </p>
                          {!result.isCorrect && (
                            <p>
                              <span className="text-gray-500">
                                Correct answer:
                              </span>{" "}
                              <span className="text-green-600 font-medium">
                                {result.correctAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {result.explanation && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          <span className="font-medium">Explanation:</span>{" "}
                          {result.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Show generating state (single loader)
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#0794d4]/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Generating Questions
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            AI is creating practice questions from your study guide...
          </p>
        </div>
      </div>
    );
  }

  // Show loading state for topic list
  if (loading && viewMode === "topics") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === "topics" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
              <p className="text-gray-600 mt-1">
                Test your knowledge with AI-generated practice questions
              </p>
            </div>
          </div>

          {/* Usage Limits Banner */}
          {limits && (
            <Card
              className={`p-4 ${
                limits.can_practice
                  ? "bg-[#0794d4]/5 border-[#0794d4]/20"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {limits.can_practice ? (
                    <Zap className="w-5 h-5 text-[#0794d4]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {limits.is_paid_user ? "Premium Plan" : "Free Plan"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {limits.is_paid_user
                        ? `${limits.questions_remaining_today} questions remaining today`
                        : `${limits.questions_remaining_month} questions remaining this month`}
                    </p>
                  </div>
                </div>
                {!limits.is_paid_user && (
                  <Button
                    size="sm"
                    className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Stats Overview */}
          {stats && stats.totalSessions > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0794d4]/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#0794d4]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalSessions}
                    </p>
                    <p className="text-xs text-gray-500">Sessions</p>
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
                      {stats.totalCorrect}
                    </p>
                    <p className="text-xs text-gray-500">Correct</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalQuestions}
                    </p>
                    <p className="text-xs text-gray-500">Questions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.averageScore.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Difficulty Selection */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Difficulty */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Select Difficulty
                </p>
                <div className="flex gap-3">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedDifficulty(level)}
                      className={`px-4 py-2 rounded-lg capitalize transition-all ${
                        selectedDifficulty === level
                          ? level === "easy"
                            ? "bg-green-100 text-green-700 border-2 border-green-500"
                            : level === "medium"
                            ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-500"
                            : "bg-red-100 text-red-700 border-2 border-red-500"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Number of Questions
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setQuestionCount(Math.max(1, questionCount - 1))
                    }
                    disabled={questionCount <= 1}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="w-16 h-10 rounded-lg bg-[#0794d4]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#0794d4]">
                      {questionCount}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setQuestionCount(Math.min(10, questionCount + 1))
                    }
                    disabled={questionCount >= 10}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-500">(1-10)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Topics Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose a Topic
            </h2>
            {topics.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No topics available
                </h3>
                <p className="text-sm text-gray-500">
                  Practice topics will appear here once they're added by your
                  teacher
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topics.map(renderTopicCard)}
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          {recentSessions && recentSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Sessions
              </h2>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${session.practice_topics?.color}20`,
                          }}
                        >
                          {session.practice_topics?.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.practice_topics?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.started_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#0794d4]">
                          {session.score?.toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.correct_answers}/{session.total_questions}{" "}
                          correct
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === "practice" && renderQuestion()}
      {viewMode === "results" && renderResults()}
    </div>
  );
}
