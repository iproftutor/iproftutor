"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Search,
  Target,
  Trash2,
  Edit2,
  X,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface PracticeTopic {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  country_code: string;
  question_count: number;
  created_at: string;
}

interface PracticeQuestion {
  id: string;
  topic_id: string;
  question: string;
  question_type: "mcq" | "text" | "true_false";
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

interface CountryPack {
  code: string;
  name: string;
  flag: string;
}

export default function CountryPracticePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [country, setCountry] = useState<CountryPack | null>(null);
  const [topics, setTopics] = useState<PracticeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<PracticeTopic | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<PracticeTopic | null>(
    null
  );
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<PracticeQuestion | null>(null);

  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    subject: "",
    grade_level: "",
  });

  const [questionForm, setQuestionForm] = useState({
    question: "",
    question_type: "mcq" as "mcq" | "text" | "true_false",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    points: 10,
  });

  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
  ];

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  const fetchCountry = useCallback(async () => {
    try {
      const res = await fetch(`/api/country-packs?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCountry(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching country:", error);
    }
  }, [code]);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch(`/api/practice/topics?country_code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  }, [code]);

  const fetchQuestions = useCallback(async (topicId: string) => {
    try {
      const res = await fetch(`/api/practice/questions?topic_id=${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  }, []);

  useEffect(() => {
    fetchCountry();
    fetchTopics();
  }, [fetchCountry, fetchTopics]);

  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions(selectedTopic.id);
    }
  }, [selectedTopic, fetchQuestions]);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...topicForm,
        country_code: code,
      };

      const method = editingTopic ? "PUT" : "POST";
      const body = editingTopic ? { ...payload, id: editingTopic.id } : payload;

      const res = await fetch("/api/practice/topics", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowTopicModal(false);
        setEditingTopic(null);
        setTopicForm({
          title: "",
          description: "",
          subject: "",
          grade_level: "",
        });
        fetchTopics();
      }
    } catch (error) {
      console.error("Error saving topic:", error);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;

    try {
      const payload = {
        ...questionForm,
        topic_id: selectedTopic.id,
        options:
          questionForm.question_type === "mcq"
            ? questionForm.options.filter((o) => o.trim())
            : undefined,
      };

      const method = editingQuestion ? "PUT" : "POST";
      const body = editingQuestion
        ? { ...payload, id: editingQuestion.id }
        : payload;

      const res = await fetch("/api/practice/questions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowQuestionModal(false);
        setEditingQuestion(null);
        setQuestionForm({
          question: "",
          question_type: "mcq",
          options: ["", "", "", ""],
          correct_answer: "",
          explanation: "",
          difficulty: "medium",
          points: 10,
        });
        fetchQuestions(selectedTopic.id);
        fetchTopics(); // Refresh topic count
      }
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (
      !confirm(
        "Are you sure? This will delete the topic and all its questions."
      )
    )
      return;

    try {
      const res = await fetch(`/api/practice/topics?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedTopic?.id === id) {
          setSelectedTopic(null);
          setQuestions([]);
        }
        fetchTopics();
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/practice/questions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok && selectedTopic) {
        fetchQuestions(selectedTopic.id);
        fetchTopics();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const openEditTopicModal = (topic: PracticeTopic) => {
    setEditingTopic(topic);
    setTopicForm({
      title: topic.title,
      description: topic.description || "",
      subject: topic.subject || "",
      grade_level: topic.grade_level || "",
    });
    setShowTopicModal(true);
  };

  const openEditQuestionModal = (question: PracticeQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      question_type: question.question_type,
      options: question.options || ["", "", "", ""],
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
      difficulty: question.difficulty,
      points: question.points,
    });
    setShowQuestionModal(true);
  };

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {country?.flag} {country?.name} - Practice Questions
              </h1>
              <p className="text-gray-500">
                Manage practice topics and questions
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Topics List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Topics</CardTitle>
                <Button size="sm" onClick={() => setShowTopicModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search topics..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filteredTopics.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No topics yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTopic?.id === topic.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {topic.title}
                            </h4>
                            <div className="flex gap-2 mt-1">
                              {topic.subject && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  {topic.subject}
                                </span>
                              )}
                              {topic.grade_level && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  {topic.grade_level}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {topic.question_count || 0} questions
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTopicModal(topic);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Questions Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedTopic ? selectedTopic.title : "Select a Topic"}
                </CardTitle>
                {selectedTopic && (
                  <Button size="sm" onClick={() => setShowQuestionModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedTopic ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Select a topic to view and manage questions
                    </p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      No questions in this topic
                    </p>
                    <Button onClick={() => setShowQuestionModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                Q{idx + 1}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  q.difficulty === "easy"
                                    ? "bg-green-100 text-green-700"
                                    : q.difficulty === "hard"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              <span className="text-xs text-gray-500">
                                {q.points} pts
                              </span>
                            </div>
                            <p className="text-gray-900 mb-2">{q.question}</p>

                            {q.question_type === "mcq" && q.options && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {q.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={`text-sm px-2 py-1 rounded ${
                                      opt === q.correct_answer
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + i)}. {opt}
                                    {opt === q.correct_answer && (
                                      <CheckCircle className="inline h-3 w-3 ml-1" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.question_type === "true_false" && (
                              <p className="text-sm text-green-700">
                                Answer: {q.correct_answer}
                              </p>
                            )}

                            {q.question_type === "text" && (
                              <p className="text-sm text-green-700">
                                Answer: {q.correct_answer}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditQuestionModal(q)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDeleteQuestion(q.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Topic Modal */}
        {showTopicModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingTopic ? "Edit Topic" : "Add New Topic"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTopicModal(false);
                    setEditingTopic(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={topicForm.title}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, title: e.target.value })
                    }
                    placeholder="Topic title"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={topicForm.description}
                    onChange={(e) =>
                      setTopicForm({
                        ...topicForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Topic description"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject</Label>
                    <select
                      value={topicForm.subject}
                      onChange={(e) =>
                        setTopicForm({ ...topicForm, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Grade Level</Label>
                    <select
                      value={topicForm.grade_level}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          grade_level: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select grade</option>
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowTopicModal(false);
                      setEditingTopic(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {editingTopic ? "Update" : "Create"} Topic
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div>
                  <Label>Question *</Label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question: e.target.value,
                      })
                    }
                    placeholder="Enter your question"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Question Type *</Label>
                  <select
                    value={questionForm.question_type}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question_type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>

                {questionForm.question_type === "mcq" && (
                  <div>
                    <Label>Options *</Label>
                    <div className="space-y-2">
                      {questionForm.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="w-8 py-2 text-center text-gray-500">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...questionForm.options];
                              newOpts[i] = e.target.value;
                              setQuestionForm({
                                ...questionForm,
                                options: newOpts,
                              });
                            }}
                            placeholder={`Option ${String.fromCharCode(
                              65 + i
                            )}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Correct Answer *</Label>
                  {questionForm.question_type === "mcq" ? (
                    <select
                      value={questionForm.correct_answer}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correct_answer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select correct answer</option>
                      {questionForm.options
                        .filter((o) => o.trim())
                        .map((opt, i) => (
                          <option key={i} value={opt}>
                            {String.fromCharCode(65 + i)}. {opt}
                          </option>
                        ))}
                    </select>
                  ) : questionForm.question_type === "true_false" ? (
                    <select
                      value={questionForm.correct_answer}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correct_answer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select answer</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : (
                    <Input
                      value={questionForm.correct_answer}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correct_answer: e.target.value,
                        })
                      }
                      placeholder="Enter the correct answer"
                      required
                    />
                  )}
                </div>

                <div>
                  <Label>Explanation</Label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        explanation: e.target.value,
                      })
                    }
                    placeholder="Explain the answer (shown after answering)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Difficulty</Label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          difficulty: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          points: parseInt(e.target.value) || 10,
                        })
                      }
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowQuestionModal(false);
                      setEditingQuestion(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {editingQuestion ? "Update" : "Add"} Question
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
