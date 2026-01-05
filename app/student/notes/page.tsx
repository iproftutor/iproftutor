"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Upload,
  Search,
  Download,
  Trash2,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface NoteContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  is_admin_upload: boolean;
  created_at: string;
}

export default function NotesPage() {
  const supabase = createClient();
  const [notes, setNotes] = useState<NoteContent[]>([]);
  const [myNotes, setMyNotes] = useState<NoteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      // Fetch admin uploads (visible to all)
      const { data: adminNotes, error: adminError } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "note")
        .eq("is_admin_upload", true)
        .order("created_at", { ascending: false });

      if (adminError) throw adminError;

      // Fetch user's own uploads
      const { data: userNotes, error: userError } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "note")
        .eq("uploaded_by", user.id)
        .eq("is_admin_upload", false)
        .order("created_at", { ascending: false });

      if (userError) throw userError;

      setNotes(adminNotes || []);
      setMyNotes(userNotes || []);
    } catch (error: any) {
      toast.error("Failed to load notes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("bucket", "notes");
      formData.append("folder", user?.id || "uploads");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();

      // Create content record
      const { error: dbError } = await supabase.from("content").insert({
        content_type: "note",
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || null,
        file_url: uploadData.url,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploaded_by: user?.id,
        is_admin_upload: false,
      });

      if (dbError) throw dbError;

      toast.success("Note uploaded successfully!");
      setShowUploadModal(false);
      setUploadTitle("");
      setUploadDescription("");
      setSelectedFile(null);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload note");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (note: NoteContent) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      // Delete from storage
      const path = note.file_url.split("/notes/")[1];
      if (path) {
        await supabase.storage.from("notes").remove([path]);
      }

      // Delete from database
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", note.id);

      if (error) throw error;

      toast.success("Note deleted");
      fetchNotes();
    } catch (error: any) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("word") || fileType?.includes("document"))
      return "📝";
    if (fileType?.includes("text")) return "📃";
    return "📁";
  };

  const filteredNotes = (activeTab === "all" ? notes : myNotes).filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.file_name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600 mt-1">
            Access notes and upload your own study materials
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Note
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-[#0794d4] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "my"
                ? "bg-[#0794d4] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            My Notes ({myNotes.length})
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery
              ? "No notes found"
              : activeTab === "my"
              ? "No uploads yet"
              : "No notes available"}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try adjusting your search query"
              : activeTab === "my"
              ? "Upload your first note to get started"
              : "Check back later for new notes"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getFileIcon(note.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {note.title}
                  </h3>
                  {note.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {note.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{formatFileSize(note.file_size)}</span>
                    <span>•</span>
                    <span>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(note.file_url, "_blank")}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = note.file_url;
                    link.download = note.file_name;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                {!note.is_admin_upload && note.uploaded_by === user?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(note)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Note
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadTitle("");
                  setUploadDescription("");
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter note title"
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0794d4] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? "border-[#0794d4] bg-[#0794d4]/5"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() =>
                    document.getElementById("note-file-input")?.click()
                  }
                >
                  <input
                    id="note-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-[#0794d4]">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Click to select a file</p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, TXT, MD (Max 50MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadTitle("");
                    setUploadDescription("");
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !uploadTitle.trim()}
                  className="flex-1 bg-[#0794d4] hover:bg-[#0680bc] text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
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
