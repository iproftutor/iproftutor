"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CreditCard,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  question_type: string;
  options: string[] | null;
  correct_option: string | null;
  created_at: string;
}

export default function CountryFlashcardsPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryName, setCountryName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    question_type: "text",
    options: ["", "", "", ""],
    correct_option: "",
  });

  useEffect(() => {
    fetchCountryName();
    fetchFlashcards();
  }, [code]);

  const fetchCountryName = async () => {
    try {
      const response = await fetch("/api/country-packs");
      if (response.ok) {
        const data = await response.json();
        const country = data.find((c: any) => c.code === code);
        setCountryName(country?.name || code);
      }
    } catch (error) {
      console.error("Failed to fetch country:", error);
    }
  };

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/flashcards?country_code=${code}`);
      if (response.ok) {
        const data = await response.json();
        setFlashcards(data);
      }
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = editingCard ? "PUT" : "POST";
      const body = {
        ...formData,
        country_code: code,
        ...(editingCard && { id: editingCard.id }),
        options:
          formData.question_type === "mcq"
            ? formData.options.filter((o) => o.trim())
            : null,
      };

      const response = await fetch("/api/flashcards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingCard ? "Flashcard updated" : "Flashcard created");
        setShowModal(false);
        setEditingCard(null);
        resetForm();
        fetchFlashcards();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save flashcard");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;

    try {
      const response = await fetch(`/api/flashcards?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Flashcard deleted");
        fetchFlashcards();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete flashcard");
    }
  };

  const openEditModal = (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      question: card.question,
      answer: card.answer || "",
      question_type: card.question_type,
      options: card.options || ["", "", "", ""],
      correct_option: card.correct_option || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      question_type: "text",
      options: ["", "", "", ""],
      correct_option: "",
    });
  };

  const filteredCards = flashcards.filter((c) =>
    c.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/country-packs/${code}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage flashcards for {countryName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCard(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-[#0794d4] hover:bg-[#0678ab]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Flashcard
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search flashcards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Flashcards Grid */}
      {filteredCards.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">No flashcards yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create flashcards for students in {countryName}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Flashcard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <Card key={card.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    card.question_type === "mcq"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {card.question_type === "mcq" ? "Multiple Choice" : "Text"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {card.question}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {card.question_type === "mcq"
                  ? `Answer: ${card.correct_option}`
                  : card.answer}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingCard ? "Edit Flashcard" : "Add Flashcard"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCard(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Question Type</Label>
                <select
                  value={formData.question_type}
                  onChange={(e) =>
                    setFormData({ ...formData, question_type: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="text">Text Answer</option>
                  <option value="mcq">Multiple Choice</option>
                </select>
              </div>

              <div>
                <Label>Question</Label>
                <textarea
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter the question..."
                  className="mt-1 w-full px-3 py-2 border rounded-lg min-h-20"
                />
              </div>

              {formData.question_type === "text" ? (
                <div>
                  <Label>Answer</Label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    placeholder="Enter the answer..."
                    className="mt-1 w-full px-3 py-2 border rounded-lg min-h-20"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2 mt-1">
                      {formData.options.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <select
                      value={formData.correct_option}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          correct_option: e.target.value,
                        })
                      }
                      className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="">Select correct answer</option>
                      {formData.options
                        .filter((o) => o.trim())
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCard(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.question}
                  className="flex-1 bg-[#0794d4] hover:bg-[#0678ab]"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {editingCard ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
