"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  XCircle,
  ListChecks,
  FileText,
  AlignLeft,
  Pencil,
  Image,
} from "lucide-react";
import { toast } from "sonner";

type QuestionType =
  | "short"
  | "long"
  | "multiple_choice"
  | "fill_blank"
  | "image";

interface FlashcardOption {
  label: string;
  text: string;
}

interface Flashcard {
  id: string;
  question_type: QuestionType;
  question: string;
  answer: string | null;
  options: FlashcardOption[] | null;
  correct_option: string | null;
  image_url: string | null;
  created_at: string;
}

const questionTypeLabels: Record<QuestionType, string> = {
  short: "Short Answer",
  long: "Long Answer",
  multiple_choice: "Multiple Choice",
  fill_blank: "Fill in the Blank",
  image: "Image Based",
};

const questionTypeColors: Record<QuestionType, { bg: string; text: string }> = {
  short: { bg: "bg-blue-100", text: "text-blue-700" },
  long: { bg: "bg-green-100", text: "text-green-700" },
  multiple_choice: { bg: "bg-purple-100", text: "text-purple-700" },
  fill_blank: { bg: "bg-orange-100", text: "text-orange-700" },
  image: { bg: "bg-pink-100", text: "text-pink-700" },
};

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  short: <FileText className="w-4 h-4" />,
  long: <AlignLeft className="w-4 h-4" />,
  multiple_choice: <ListChecks className="w-4 h-4" />,
  fill_blank: <Pencil className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
};

export default function FlashcardPage() {
  const supabase = createClient();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [studyMode, setStudyMode] = useState<"browse" | "quiz">("browse");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");

  const fetchFlashcards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFlashcards(data || []);
    } catch (error: any) {
      toast.error("Failed to load flashcards");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const filteredFlashcards =
    filterType === "all"
      ? flashcards
      : flashcards.filter((f) => f.question_type === filterType);

  const currentCard = filteredFlashcards[currentIndex];

  const resetCardState = () => {
    setShowAnswer(false);
    setSelectedOption(null);
    setUserAnswer("");
    setIsAnswerChecked(false);
    setIsCorrect(null);
  };

  const goToNext = () => {
    if (currentIndex < filteredFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetCardState();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetCardState();
    }
  };

  const shuffleCards = () => {
    const shuffled = [...filteredFlashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    resetCardState();
    toast.success("Cards shuffled!");
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setScore({ correct: 0, wrong: 0 });
    resetCardState();
    toast.success("Study session reset!");
  };

  const checkAnswer = () => {
    if (!currentCard) return;

    let correct = false;

    if (currentCard.question_type === "multiple_choice") {
      correct = selectedOption === currentCard.correct_option;
    } else if (currentCard.question_type === "fill_blank") {
      correct =
        userAnswer.toLowerCase().trim() ===
        currentCard.answer?.toLowerCase().trim();
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);
    setShowAnswer(true);

    if (studyMode === "quiz") {
      if (correct) {
        setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      }
    }
  };

  const handleFilterChange = (type: QuestionType | "all") => {
    setFilterType(type);
    setCurrentIndex(0);
    resetCardState();
  };

  const typeCounts = {
    all: flashcards.length,
    short: flashcards.filter((f) => f.question_type === "short").length,
    long: flashcards.filter((f) => f.question_type === "long").length,
    multiple_choice: flashcards.filter(
      (f) => f.question_type === "multiple_choice"
    ).length,
    fill_blank: flashcards.filter((f) => f.question_type === "fill_blank")
      .length,
    image: flashcards.filter((f) => f.question_type === "image").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600 mt-1">
            Study with interactive flashcards
          </p>
        </div>
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No flashcards available
          </h3>
          <p className="text-gray-500">
            Check back later for study materials from your tutors
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600 mt-1">
            Study with interactive flashcards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={studyMode === "browse" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStudyMode("browse");
              resetCardState();
            }}
            className={
              studyMode === "browse" ? "bg-[#0794d4] hover:bg-[#0794d4]/90" : ""
            }
          >
            Browse
          </Button>
          <Button
            variant={studyMode === "quiz" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStudyMode("quiz");
              setScore({ correct: 0, wrong: 0 });
              resetCardState();
            }}
            className={
              studyMode === "quiz" ? "bg-[#0794d4] hover:bg-[#0794d4]/90" : ""
            }
          >
            Quiz Mode
          </Button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === "all"
              ? "bg-[#0794d4] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({typeCounts.all})
        </button>
        {(Object.keys(questionTypeLabels) as QuestionType[]).map((type) => {
          if (typeCounts[type] === 0) return null;
          const colors = questionTypeColors[type];
          return (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filterType === type
                  ? `${colors.bg} ${colors.text}`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {questionTypeIcons[type]}
              {questionTypeLabels[type]} ({typeCounts[type]})
            </button>
          );
        })}
      </div>

      {/* Quiz Score */}
      {studyMode === "quiz" && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-green-600">
                  {score.correct}
                </span>
                <span className="text-gray-500">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-lg font-semibold text-red-600">
                  {score.wrong}
                </span>
                <span className="text-gray-500">Wrong</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {score.correct + score.wrong > 0 && (
                <>
                  Accuracy:{" "}
                  {Math.round(
                    (score.correct / (score.correct + score.wrong)) * 100
                  )}
                  %
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Flashcard Display */}
      {filteredFlashcards.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No flashcards in this category
          </h3>
          <p className="text-gray-500">Try selecting a different filter</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Card {currentIndex + 1} of {filteredFlashcards.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={shuffleCards}>
                <Shuffle className="w-4 h-4 mr-1" />
                Shuffle
              </Button>
              <Button variant="ghost" size="sm" onClick={resetStudy}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-full bg-[#0794d4] rounded-full transition-all"
              style={{
                width: `${
                  ((currentIndex + 1) / filteredFlashcards.length) * 100
                }%`,
              }}
            />
          </div>

          {/* Card */}
          <Card className="p-6 min-h-[300px]">
            {currentCard && (
              <div className="space-y-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                      questionTypeColors[currentCard.question_type].bg
                    } ${questionTypeColors[currentCard.question_type].text}`}
                  >
                    {questionTypeIcons[currentCard.question_type]}
                    {questionTypeLabels[currentCard.question_type]}
                  </span>
                </div>

                {/* Question */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentCard.question_type === "fill_blank"
                      ? currentCard.question.replace(/_____/g, "_______")
                      : currentCard.question}
                  </h2>
                </div>

                {/* Image */}
                {currentCard.image_url && (
                  <div className="flex justify-center">
                    <img
                      src={currentCard.image_url}
                      alt="Question image"
                      className="max-w-full max-h-64 rounded-lg object-contain"
                    />
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentCard.question_type === "multiple_choice" &&
                  currentCard.options && (
                    <div className="space-y-2 mt-4">
                      {currentCard.options.map((opt) => {
                        const isSelected = selectedOption === opt.label;
                        const isCorrectOption =
                          opt.label === currentCard.correct_option;
                        const showResult = isAnswerChecked;

                        return (
                          <button
                            key={opt.label}
                            onClick={() => {
                              if (!isAnswerChecked) {
                                setSelectedOption(opt.label);
                              }
                            }}
                            disabled={isAnswerChecked}
                            className={`w-full p-3 text-left rounded-lg border transition-colors flex items-center gap-3 ${
                              showResult
                                ? isCorrectOption
                                  ? "bg-green-100 border-green-500 text-green-800"
                                  : isSelected
                                  ? "bg-red-100 border-red-500 text-red-800"
                                  : "bg-gray-50 border-gray-200 text-gray-600"
                                : isSelected
                                ? "bg-[#0794d4]/10 border-[#0794d4] text-[#0794d4]"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                                showResult
                                  ? isCorrectOption
                                    ? "bg-green-200 text-green-800"
                                    : isSelected
                                    ? "bg-red-200 text-red-800"
                                    : "bg-gray-200 text-gray-600"
                                  : isSelected
                                  ? "bg-[#0794d4] text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {showResult && isCorrectOption && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                            {showResult && isSelected && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* Fill in the Blank Input */}
                {currentCard.question_type === "fill_blank" && !showAnswer && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#0794d4] focus:border-transparent text-gray-900"
                      disabled={isAnswerChecked}
                    />
                  </div>
                )}

                {/* Answer Display */}
                {showAnswer &&
                  currentCard.question_type !== "multiple_choice" && (
                    <div
                      className={`mt-4 p-4 rounded-lg ${
                        currentCard.question_type === "fill_blank" &&
                        isAnswerChecked
                          ? isCorrect
                            ? "bg-green-100"
                            : "bg-red-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {currentCard.question_type === "fill_blank" &&
                        isAnswerChecked && (
                          <div className="flex items-center gap-2 mb-2">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-700">
                                  Correct!
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="font-medium text-red-700">
                                  Incorrect
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      <p className="font-medium text-gray-700">Answer:</p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {currentCard.answer}
                      </p>
                    </div>
                  )}

                {/* Result for MCQ */}
                {isAnswerChecked &&
                  currentCard.question_type === "multiple_choice" && (
                    <div
                      className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                        isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-700">
                            Correct!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-red-700">
                            Incorrect. The correct answer is{" "}
                            {currentCard.correct_option}.
                          </span>
                        </>
                      )}
                    </div>
                  )}
              </div>
            )}
          </Card>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {/* Show/Check Answer Button */}
              {currentCard?.question_type === "multiple_choice" ||
              currentCard?.question_type === "fill_blank" ? (
                !isAnswerChecked && (
                  <Button
                    onClick={checkAnswer}
                    disabled={
                      (currentCard.question_type === "multiple_choice" &&
                        !selectedOption) ||
                      (currentCard.question_type === "fill_blank" &&
                        !userAnswer.trim())
                    }
                    className="bg-[#0794d4] hover:bg-[#0794d4]/90"
                  >
                    Check Answer
                  </Button>
                )
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  {showAnswer ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide Answer
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Show Answer
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentIndex === filteredFlashcards.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
