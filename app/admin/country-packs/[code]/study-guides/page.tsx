"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Upload,
  Trash2,
  Eye,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface StudyGuide {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export default function CountryStudyGuidesPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    fetchCountryName();
    fetchGuides();
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

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/content?type=study_guide&country_code=${code}`
      );
      if (response.ok) {
        const data = await response.json();
        setGuides(data);
      }
    } catch (error) {
      console.error("Failed to fetch guides:", error);
      toast.error("Failed to load study guides");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "study_guide");
      formData.append("country_code", code);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      const response = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Study guide uploaded");
        fetchGuides();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload");
      }
    } catch (error) {
      toast.error("Failed to upload study guide");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study guide?")) return;

    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Study guide deleted");
        fetchGuides();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete study guide");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredGuides = guides.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">Study Guides</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage study guides for {countryName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
            id="upload-guide"
          />
          <label htmlFor="upload-guide">
            <Button
              asChild
              disabled={uploading}
              className="bg-[#0794d4] hover:bg-[#0678ab]"
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload PDF
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search study guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Guides List */}
      {filteredGuides.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">
            No study guides yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload PDF documents for students in {countryName}
          </p>
          <label htmlFor="upload-guide">
            <Button asChild variant="outline">
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Guide
              </span>
            </Button>
          </label>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGuides.map((guide) => (
            <Card key={guide.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{guide.title}</h3>
                    <p className="text-sm text-gray-500">
                      {guide.file_name} • {formatFileSize(guide.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {guide.file_url && (
                    <a
                      href={guide.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <a href={guide.file_url} download>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(guide.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
