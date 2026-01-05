"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Headphones, Search, Loader2, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PodcastContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

export default function PodcastPage() {
  const supabase = createClient();
  const [podcasts, setPodcasts] = useState<PodcastContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastContent | null>(
    null
  );

  const fetchPodcasts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "podcast")
        .eq("is_admin_upload", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPodcasts(data || []);
    } catch (error: any) {
      toast.error("Failed to load podcasts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

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

  const filteredPodcasts = podcasts.filter(
    (podcast) =>
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">Podcasts</h1>
        <p className="text-gray-600 mt-1">
          Listen to educational podcasts and audio content
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search podcasts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-lg"
        />
      </div>

      {/* Podcasts Grid */}
      {filteredPodcasts.length === 0 ? (
        <Card className="p-12 text-center">
          <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No podcasts found" : "No podcasts available"}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try adjusting your search query"
              : "Check back later for new podcast content"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPodcasts.map((podcast) => {
            const videoId = getYouTubeVideoId(podcast.file_url);
            const thumbnail = getYouTubeThumbnail(podcast.file_url);

            return (
              <Card
                key={podcast.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPodcast(podcast)}
              >
                <div className="relative aspect-video bg-gray-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={podcast.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Headphones className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-[#0794d4] ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded">
                      Podcast
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-1">
                    {podcast.title}
                  </h3>
                  {podcast.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {podcast.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(podcast.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Podcast Player Modal */}
      {selectedPodcast && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPodcast(null)}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded">
                  Podcast
                </span>
                <h2 className="text-lg font-semibold text-white truncate pr-4">
                  {selectedPodcast.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={selectedPodcast.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white flex items-center gap-1 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in YouTube
                </a>
                <button
                  onClick={() => setSelectedPodcast(null)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {getYouTubeVideoId(selectedPodcast.file_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                    selectedPodcast.file_url
                  )}?autoplay=1`}
                  title={selectedPodcast.title}
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
            {selectedPodcast.description && (
              <p className="text-white/70 mt-4 text-sm">
                {selectedPodcast.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
