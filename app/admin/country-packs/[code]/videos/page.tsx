"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Search,
  Video,
  Trash2,
  ExternalLink,
  Edit2,
  X,
  Save,
} from "lucide-react";

interface VideoContent {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url?: string;
  subject: string;
  grade_level: string;
  country_code: string;
  created_at: string;
}

interface CountryPack {
  code: string;
  name: string;
  flag: string;
}

export default function CountryVideosPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [country, setCountry] = useState<CountryPack | null>(null);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail_url: "",
    subject: "",
    grade_level: "",
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
    "Literature",
    "Art",
    "Music",
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

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/content?content_type=video&country_code=${code}`
      );
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchCountry();
    fetchVideos();
  }, [fetchCountry, fetchVideos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        content_type: "video",
        country_code: code,
        is_admin_upload: true,
      };

      const method = editingVideo ? "PUT" : "POST";
      const body = editingVideo ? { ...payload, id: editingVideo.id } : payload;

      const res = await fetch("/api/content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowAddModal(false);
        setEditingVideo(null);
        setFormData({
          title: "",
          description: "",
          url: "",
          thumbnail_url: "",
          subject: "",
          grade_level: "",
        });
        fetchVideos();
      }
    } catch (error) {
      console.error("Error saving video:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/content?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const openEditModal = (video: VideoContent) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      url: video.url,
      thumbnail_url: video.thumbnail_url || "",
      subject: video.subject || "",
      grade_level: video.grade_level || "",
    });
    setShowAddModal(true);
  };

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getVideoThumbnail = (url: string) => {
    // Extract YouTube video ID
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
    );
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

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
                {country?.flag} {country?.name} - Videos
              </h1>
              <p className="text-gray-500">
                Manage educational videos for this country
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No videos yet
              </h3>
              <p className="text-gray-500 mb-4">
                Add educational videos for students in {country?.name}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const thumbnail =
                video.thumbnail_url || getVideoThumbnail(video.url);
              return (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {video.subject && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {video.subject}
                        </span>
                      )}
                      {video.grade_level && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {video.grade_level}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(video.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Watch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(video)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(video.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingVideo ? "Edit Video" : "Add New Video"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVideo(null);
                    setFormData({
                      title: "",
                      description: "",
                      url: "",
                      thumbnail_url: "",
                      subject: "",
                      grade_level: "",
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Video title"
                    required
                  />
                </div>

                <div>
                  <Label>Video URL *</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    YouTube, Vimeo, or direct video URL
                  </p>
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Video description"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Custom Thumbnail URL</Label>
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thumbnail_url: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-detect from YouTube
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject</Label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
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
                      value={formData.grade_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                      setShowAddModal(false);
                      setEditingVideo(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {editingVideo ? "Update" : "Add"} Video
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
