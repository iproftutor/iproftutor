"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Video, Search, Loader2, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface VideoContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

export default function VideoPage() {
  const supabase = createClient();
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "video")
        .eq("is_admin_upload", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (error: any) {
      toast.error("Failed to load videos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
        <p className="text-gray-600 mt-1">
          Watch educational videos curated by our tutors
        </p>
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
            {searchQuery ? "No videos found" : "No videos available"}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try adjusting your search query"
              : "Check back later for new video content"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const videoId = getYouTubeVideoId(video.file_url);
            const thumbnail = getYouTubeThumbnail(video.file_url);

            return (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedVideo(video)}
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
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-[#0794d4] ml-1" />
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white truncate pr-4">
                {selectedVideo.title}
              </h2>
              <div className="flex items-center gap-3">
                <a
                  href={selectedVideo.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white flex items-center gap-1 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in YouTube
                </a>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {getYouTubeVideoId(selectedVideo.file_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                    selectedVideo.file_url
                  )}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Invalid video URL
                </div>
              )}
            </div>
            {selectedVideo.description && (
              <p className="text-white/70 mt-4 text-sm">
                {selectedVideo.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
