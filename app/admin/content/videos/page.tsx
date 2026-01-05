"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Video,
  Search,
  Trash2,
  Loader2,
  X,
  Plus,
  ExternalLink,
  Play,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "../../context/AdminContext";

interface VideoContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  country_code: string;
}

export default function AdminVideosPage() {
  const supabase = createClient();
  const { selectedCountry } = useAdmin();
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [user, setUser] = useState<any>(null);

  const fetchVideos = useCallback(async () => {
    if (!selectedCountry) {
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "video")
        .eq("is_admin_upload", true)
        .eq("country_code", selectedCountry.code)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (error: any) {
      toast.error("Failed to load videos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCountry]);

  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [fetchVideos]);

  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return "";
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    return getYouTubeVideoId(url) !== null;
  };

  const handleAddVideo = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      toast.error("Please enter a title and YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("content").insert({
        content_type: "video",
        title: videoTitle.trim(),
        description: videoDescription.trim() || null,
        file_url: videoUrl.trim(),
        uploaded_by: user?.id,
        is_admin_upload: true,
        country_code: selectedCountry?.code,
      });

      if (error) throw error;

      toast.success("Video added successfully!");
      setShowAddModal(false);
      setVideoTitle("");
      setVideoDescription("");
      setVideoUrl("");
      fetchVideos();
    } catch (error: any) {
      toast.error(error.message || "Failed to add video");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (video: VideoContent) => {
    if (
      !confirm(
        "Are you sure you want to delete this video? This will remove it for all users."
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", video.id);

      if (error) throw error;

      toast.success("Video deleted");
      fetchVideos();
    } catch (error: any) {
      toast.error("Failed to delete video");
      console.error(error);
    }
  };

  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          videos for that region.
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
            {selectedCountry.flag} Videos
          </h1>
          <p className="text-gray-600 mt-1">
            Manage YouTube videos for {selectedCountry.name}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {videos.length}
          </div>
          <div className="text-sm text-gray-600">Total Videos</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {
              videos.filter(
                (v) =>
                  new Date(v.created_at) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Added This Week</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">
            {
              videos.filter(
                (v) =>
                  new Date(v.created_at) >
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Added This Month</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-lg"
        />
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No videos found" : "No videos yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search query"
              : "Add your first YouTube video to get started"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#0794d4] hover:bg-[#0680bc] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const thumbnail = getYouTubeThumbnail(video.file_url);

            return (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video bg-gray-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-red-600 ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(video.file_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(video)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Video</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setVideoTitle("");
                  setVideoDescription("");
                  setVideoUrl("");
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
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL *
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="rounded-lg"
                />
                {videoUrl && !isValidYouTubeUrl(videoUrl) && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter a valid YouTube URL
                  </p>
                )}
                {videoUrl && isValidYouTubeUrl(videoUrl) && (
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={getYouTubeThumbnail(videoUrl)}
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0794d4] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    setVideoTitle("");
                    setVideoDescription("");
                    setVideoUrl("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddVideo}
                  disabled={
                    submitting ||
                    !videoTitle.trim() ||
                    !isValidYouTubeUrl(videoUrl)
                  }
                  className="flex-1 bg-[#0794d4] hover:bg-[#0680bc] text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Video"
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
