"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Target,
  Plus,
  Search,
  Trash2,
  Loader2,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "../../context/AdminContext";

interface StudyGuide {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  created_at: string;
  questionCount?: number;
}

interface Question {
  id: string;
  source_content_id: string;
  question_type:
    | "multiple_choice"
    | "true_false"
    | "fill_blank"
    | "short_answer";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answer: string;
  options: { label: string; text: string }[] | null;
  correct_option: string | null;
  explanation: string | null;
  is_ai_generated: boolean;
  is_admin_created: boolean;
  created_at: string;
  content?: StudyGuide;
}

export default function AdminPracticeQuestionsPage() {
  const supabase = createClient();
  const { selectedCountry } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuideFilter, setSelectedGuideFilter] = useState<
    string | "all"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Form state for manual question creation
  const [formData, setFormData] = useState({
    source_content_id: "",
    question_type: "multiple_choice" as Question["question_type"],
    difficulty: "medium" as Question["difficulty"],
    question: "",
    answer: "",
    options: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ],
    correct_option: "A",
    explanation: "",
  });

  // Generate modal state
  const [generateData, setGenerateData] = useState({
    content_id: "",
    custom_content: "",
    count: 10,
  });

  const fetchData = useCallback(async () => {
    if (!selectedCountry) {
      setLoading(false);
      return;
    }

    try {
      // Fetch study guides with question counts for selected country
      const { data: guidesData, error: guidesError } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "study_guide")
        .eq("is_admin_upload", true)
        .eq("country_code", selectedCountry.code)
        .order("created_at", { ascending: false });

      if (guidesError) throw guidesError;

      // Get question counts for each guide
      const guidesWithCounts = await Promise.all(
        (guidesData || []).map(async (guide) => {
          const { count } = await supabase
            .from("practice_questions")
            .select("*", { count: "exact", head: true })
            .eq("source_content_id", guide.id);

          return { ...guide, questionCount: count || 0 };
        })
      );

      setStudyGuides(guidesWithCounts);

      // Fetch questions with content info
      const { data: questionsData, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*, content:source_content_id(id, title)")
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCountry]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleAddQuestion = async () => {
    if (!formData.source_content_id || !formData.question) {
      toast.error("Please select a study guide and enter a question");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const questionData: any = {
        source_content_id: formData.source_content_id,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        question: formData.question,
        explanation: formData.explanation || null,
        is_admin_created: true,
        is_ai_generated: false,
        created_by: user?.id,
      };

      if (formData.question_type === "multiple_choice") {
        questionData.options = JSON.stringify(formData.options);
        questionData.correct_option = formData.correct_option;
        questionData.answer = formData.options.find(
          (o) => o.label === formData.correct_option
        )?.text;
      } else if (formData.question_type === "true_false") {
        questionData.correct_option = formData.correct_option;
        questionData.answer = formData.correct_option;
      } else {
        questionData.answer = formData.answer;
      }

      const { error } = await supabase
        .from("practice_questions")
        .insert(questionData);

      if (error) throw error;

      toast.success("Question added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add question");
      console.error(error);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!generateData.content_id) {
      toast.error("Please select a study guide");
      return;
    }

    setGenerating(true);
    try {
      const studyGuide = studyGuides.find(
        (g) => g.id === generateData.content_id
      );

      const response = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: generateData.content_id,
          topicName: studyGuide?.title,
          customContent: generateData.custom_content || studyGuide?.description,
          count: generateData.count,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate questions");
      }

      const data = await response.json();
      toast.success(
        `Generated ${
          data.count || data.questions?.length
        } questions successfully!`
      );
      setShowGenerateModal(false);
      setGenerateData({ content_id: "", custom_content: "", count: 10 });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("practice_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Question deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete question");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      source_content_id: "",
      question_type: "multiple_choice",
      difficulty: "medium",
      question: "",
      answer: "",
      options: [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" },
      ],
      correct_option: "A",
      explanation: "",
    });
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGuide =
      selectedGuideFilter === "all" ||
      q.source_content_id === selectedGuideFilter;
    return matchesSearch && matchesGuide;
  });

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: "Multiple Choice",
      true_false: "True/False",
      fill_blank: "Fill in Blank",
      short_answer: "Short Answer",
    };
    return labels[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      hard: "bg-red-100 text-red-700",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  if (!selectedCountry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Globe className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Country Selected
        </h2>
        <p className="text-gray-500 max-w-md">
          Please select a country from the dropdown in the header to manage
          practice questions for that region.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCountry.flag} Practice Questions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage practice questions for {selectedCountry.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowGenerateModal(true)}
            variant="outline"
            className="border-[#0794d4] text-[#0794d4] hover:bg-[#0794d4]/5"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {questions.length}
          </div>
          <div className="text-sm text-gray-600">Total Questions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {questions.filter((q) => q.is_admin_created).length}
          </div>
          <div className="text-sm text-gray-600">Admin Created</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {questions.filter((q) => q.is_ai_generated).length}
          </div>
          <div className="text-sm text-gray-600">AI Generated</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-[#0794d4]">
            {studyGuides.length}
          </div>
          <div className="text-sm text-gray-600">Study Guides</div>
        </Card>
      </div>

      {/* Study Guides Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Study Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studyGuides.map((guide) => (
            <Card key={guide.id} className="p-4 border-l-4 border-l-[#0794d4]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#0794d4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {guide.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {guide.questionCount && guide.questionCount > 0 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {guide.questionCount} questions
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        No questions yet
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGenerateData({ ...generateData, content_id: guide.id });
                    setShowGenerateModal(true);
                  }}
                  className="shrink-0"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Generate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedGuideFilter}
            onChange={(e) => setSelectedGuideFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All Study Guides</option>
            {studyGuides.map((guide) => (
              <option key={guide.id} value={guide.id}>
                📚 {guide.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Questions Table */}
      {filteredQuestions.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-sm text-gray-500">
            Generate questions from study guides or add them manually
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Study Guide
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {question.question}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        📚 {(question.content as any)?.title || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded capitalize ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {question.is_ai_generated ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          AI
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Practice Question
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Study Guide */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Study Guide *
                </label>
                <select
                  value={formData.source_content_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      source_content_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select a study guide</option>
                  {studyGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      📚 {guide.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Type & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={formData.question_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        question_type: e.target
                          .value as Question["question_type"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as Question["difficulty"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter the question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={3}
                />
              </div>

              {/* Multiple Choice Options */}
              {formData.question_type === "multiple_choice" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Options
                  </label>
                  {formData.options.map((option, index) => (
                    <div key={option.label} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={formData.correct_option === option.label}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            correct_option: option.label,
                          })
                        }
                        className="w-4 h-4 text-[#0794d4]"
                      />
                      <span className="text-sm font-medium text-gray-600 w-6">
                        {option.label}.
                      </span>
                      <Input
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].text = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Option ${option.label}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    Select the radio button next to the correct answer
                  </p>
                </div>
              )}

              {/* True/False */}
              {formData.question_type === "true_false" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tf_answer"
                        checked={formData.correct_option === "true"}
                        onChange={() =>
                          setFormData({ ...formData, correct_option: "true" })
                        }
                        className="w-4 h-4 text-[#0794d4]"
                      />
                      <span className="text-sm">True</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tf_answer"
                        checked={formData.correct_option === "false"}
                        onChange={() =>
                          setFormData({ ...formData, correct_option: "false" })
                        }
                        className="w-4 h-4 text-[#0794d4]"
                      />
                      <span className="text-sm">False</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Fill Blank / Short Answer */}
              {(formData.question_type === "fill_blank" ||
                formData.question_type === "short_answer") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer *
                  </label>
                  <Input
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    placeholder="Enter the correct answer..."
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation (optional)
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Explain why this is the correct answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
                >
                  Add Question
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Generate Questions Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0794d4]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Generate Questions
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGenerateData({
                    content_id: "",
                    custom_content: "",
                    count: 10,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Study Guide */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Study Guide *
                </label>
                <select
                  value={generateData.content_id}
                  onChange={(e) =>
                    setGenerateData({
                      ...generateData,
                      content_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select a study guide</option>
                  {studyGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      📚 {guide.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Content (optional)
                </label>
                <textarea
                  value={generateData.custom_content}
                  onChange={(e) =>
                    setGenerateData({
                      ...generateData,
                      custom_content: e.target.value,
                    })
                  }
                  placeholder="Add extra content or notes to help generate better questions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The AI will use the study guide title and any additional
                  content you provide
                </p>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <select
                  value={generateData.count}
                  onChange={(e) =>
                    setGenerateData({
                      ...generateData,
                      count: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerateData({
                      content_id: "",
                      custom_content: "",
                      count: 10,
                    });
                  }}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generating || !generateData.content_id}
                  className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
