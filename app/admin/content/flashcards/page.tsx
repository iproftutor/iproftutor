"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  CreditCard,
  Search,
  Trash2,
  Loader2,
  X,
  Plus,
  Image,
  Upload,
  FileText,
  ListChecks,
  AlignLeft,
  Pencil,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "../../context/AdminContext";

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

const questionTypeColors: Record<
  QuestionType,
  { bg: string; text: string; border: string }
> = {
  short: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-l-blue-500",
  },
  long: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-l-green-500",
  },
  multiple_choice: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-l-purple-500",
  },
  fill_blank: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-l-orange-500",
  },
  image: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-l-pink-500",
  },
};

export default function AdminFlashcardsPage() {
  const supabase = createClient();
  const { selectedCountry } = useAdmin();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);

  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [options, setOptions] = useState<FlashcardOption[]>([
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ]);
  const [correctOption, setCorrectOption] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    if (!selectedCountry) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("country_code", selectedCountry.code)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFlashcards(data || []);
    } catch (error: any) {
      toast.error("Failed to load flashcards");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCountry]);

  useEffect(() => {
    setLoading(true);
    fetchFlashcards();
  }, [fetchFlashcards]);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setOptions([
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ]);
    setCorrectOption("");
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedType(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("flashcard-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("flashcard-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleCreate = async () => {
    if (!selectedType) {
      toast.error("Please select a question type");
      return;
    }

    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    // Validate based on type
    if (selectedType === "multiple_choice") {
      const filledOptions = options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        toast.error("Please provide at least 2 options");
        return;
      }
      if (!correctOption) {
        toast.error("Please select the correct answer");
        return;
      }
    } else if (selectedType === "image") {
      if (!selectedImage && !answer.trim()) {
        toast.error("Please provide an image or answer");
        return;
      }
    } else {
      if (!answer.trim()) {
        toast.error("Please enter an answer");
        return;
      }
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        setUploading(true);
        imageUrl = await uploadImage(selectedImage);
        setUploading(false);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const flashcardData: any = {
        question_type: selectedType,
        question: question.trim(),
        created_by: user?.id,
        country_code: selectedCountry?.code,
      };

      if (selectedType === "multiple_choice") {
        flashcardData.options = options.filter((o) => o.text.trim());
        flashcardData.correct_option = correctOption;
      } else {
        flashcardData.answer = answer.trim();
      }

      if (imageUrl) {
        flashcardData.image_url = imageUrl;
      }

      const { error } = await supabase.from("flashcards").insert(flashcardData);

      if (error) throw error;

      toast.success("Flashcard created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchFlashcards();
    } catch (error: any) {
      toast.error("Failed to create flashcard");
      console.error(error);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;

    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);

      if (error) throw error;

      toast.success("Flashcard deleted");
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
    } catch (error: any) {
      toast.error("Failed to delete flashcard");
      console.error(error);
    }
  };

  const filteredFlashcards = flashcards.filter((card) =>
    card.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: flashcards.length,
    short: flashcards.filter((f) => f.question_type === "short").length,
    long: flashcards.filter((f) => f.question_type === "long").length,
    mcq: flashcards.filter((f) => f.question_type === "multiple_choice").length,
    fillBlank: flashcards.filter((f) => f.question_type === "fill_blank")
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

  if (!selectedCountry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Globe className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Country Selected
        </h2>
        <p className="text-gray-500 max-w-md">
          Please select a country from the dropdown in the header to manage
          flashcards for that region.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCountry.flag} Flashcards
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage flashcards for {selectedCountry.name}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0794d4] hover:bg-[#0794d4]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Flashcard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#0794d4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.short}</p>
              <p className="text-xs text-gray-500">Short</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <AlignLeft className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.long}</p>
              <p className="text-xs text-gray-500">Long</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.mcq}</p>
              <p className="text-xs text-gray-500">MCQ</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Pencil className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.fillBlank}
              </p>
              <p className="text-xs text-gray-500">Fill Blank</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.image}</p>
              <p className="text-xs text-gray-500">Image</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search flashcards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Flashcards List */}
      {filteredFlashcards.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No flashcards found" : "No flashcards yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Create your first flashcard to get started"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0794d4] hover:bg-[#0794d4]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flashcard
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFlashcards.map((card) => {
            const colors = questionTypeColors[card.question_type];
            return (
              <Card key={card.id} className={`p-4 border-l-4 ${colors.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}
                      >
                        {questionTypeLabels[card.question_type]}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      {card.question}
                    </h3>
                    {card.image_url && (
                      <div className="mb-2">
                        <img
                          src={card.image_url}
                          alt="Question image"
                          className="max-w-xs max-h-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                    {card.question_type === "multiple_choice" ? (
                      <div className="space-y-1">
                        {card.options?.map((opt) => (
                          <div
                            key={opt.label}
                            className={`text-sm ${
                              opt.label === card.correct_option
                                ? "text-green-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {opt.label}. {opt.text}
                            {opt.label === card.correct_option && " ✓"}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Answer:</span>{" "}
                        {card.answer}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(card.id)}
                    className="text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Flashcard
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Type Selection */}
              {!selectedType ? (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    Select the type of flashcard you want to create:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedType("short")}
                      className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                    >
                      <FileText className="w-6 h-6 text-blue-600 mb-2" />
                      <h3 className="font-medium text-gray-900">
                        Short Answer
                      </h3>
                      <p className="text-sm text-gray-500">
                        Brief question with a short answer
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedType("long")}
                      className="p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-colors"
                    >
                      <AlignLeft className="w-6 h-6 text-green-600 mb-2" />
                      <h3 className="font-medium text-gray-900">Long Answer</h3>
                      <p className="text-sm text-gray-500">
                        Question with a detailed answer
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedType("multiple_choice")}
                      className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-colors"
                    >
                      <ListChecks className="w-6 h-6 text-purple-600 mb-2" />
                      <h3 className="font-medium text-gray-900">
                        Multiple Choice
                      </h3>
                      <p className="text-sm text-gray-500">
                        Question with A, B, C, D options
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedType("fill_blank")}
                      className="p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-50 text-left transition-colors"
                    >
                      <Pencil className="w-6 h-6 text-orange-600 mb-2" />
                      <h3 className="font-medium text-gray-900">
                        Fill in the Blank
                      </h3>
                      <p className="text-sm text-gray-500">
                        Sentence with missing word(s)
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedType("image")}
                      className="p-4 border rounded-lg hover:border-pink-500 hover:bg-pink-50 text-left transition-colors sm:col-span-2"
                    >
                      <Image className="w-6 h-6 text-pink-600 mb-2" />
                      <h3 className="font-medium text-gray-900">Image Based</h3>
                      <p className="text-sm text-gray-500">
                        Question with an image (graphs, diagrams, etc.)
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to type selection
                  </button>

                  <div
                    className={`inline-block text-xs font-medium px-2 py-1 rounded ${questionTypeColors[selectedType].bg} ${questionTypeColors[selectedType].text}`}
                  >
                    {questionTypeLabels[selectedType]}
                  </div>

                  {/* Question Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    {selectedType === "fill_blank" ? (
                      <div>
                        <textarea
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="Enter sentence with _____ for the blank (e.g., 'The capital of France is _____.')"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#0794d4] focus:border-transparent resize-none text-gray-900"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use _____ (five underscores) to indicate the blank
                        </p>
                      </div>
                    ) : (
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Enter your question..."
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#0794d4] focus:border-transparent resize-none text-gray-900"
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Image Upload (for image type or any type) */}
                  {(selectedType === "image" ||
                    selectedType === "multiple_choice") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image {selectedType !== "image" && "(Optional)"}
                      </label>
                      <div
                        onClick={() =>
                          document.getElementById("flashcard-image")?.click()
                        }
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-[#0794d4] transition-colors"
                      >
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-40 rounded-lg"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                                setImagePreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Click to upload image</p>
                            <p className="text-xs text-gray-400 mt-1">
                              PNG, JPG, GIF (Max 50MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="flashcard-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Answer Section */}
                  {selectedType === "multiple_choice" ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      {options.map((opt, idx) => (
                        <div
                          key={opt.label}
                          className="flex items-center gap-2"
                        >
                          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-medium text-gray-700">
                            {opt.label}
                          </span>
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[idx].text = e.target.value;
                              setOptions(newOptions);
                            }}
                            placeholder={`Option ${opt.label}`}
                            className="flex-1"
                          />
                          <button
                            onClick={() => setCorrectOption(opt.label)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              correctOption === opt.label
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {correctOption === opt.label
                              ? "Correct ✓"
                              : "Mark Correct"}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Answer
                      </label>
                      {selectedType === "long" ? (
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Enter the detailed answer..."
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#0794d4] focus:border-transparent resize-none text-gray-900"
                          rows={5}
                        />
                      ) : (
                        <Input
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder={
                            selectedType === "fill_blank"
                              ? "Enter the word(s) that fill the blank"
                              : "Enter the answer..."
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={saving}
                      className="bg-[#0794d4] hover:bg-[#0794d4]/90"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {uploading ? "Uploading..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Flashcard
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
