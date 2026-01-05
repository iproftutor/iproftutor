"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Search,
  Loader2,
  Download,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ExtraContent {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export default function ExtraPage() {
  const supabase = createClient();
  const [extras, setExtras] = useState<ExtraContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExtra, setSelectedExtra] = useState<ExtraContent | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const fetchExtras = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "extra")
        .eq("is_admin_upload", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExtras(data || []);
    } catch (error: any) {
      toast.error("Failed to load extras");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredExtras = extras.filter(
    (extra) =>
      extra.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extra.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extra.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setSelectedExtra(filteredExtras[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < filteredExtras.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setSelectedExtra(filteredExtras[selectedIndex + 1]);
    }
  };

  const openLightbox = (extra: ExtraContent, index: number) => {
    setSelectedExtra(extra);
    setSelectedIndex(index);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedExtra) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setSelectedExtra(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedExtra, selectedIndex, filteredExtras]);

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
        <h1 className="text-2xl font-bold text-gray-900">Extras</h1>
        <p className="text-gray-600 mt-1">
          Infographics, diagrams, and other visual learning materials
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search extras..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-lg"
        />
      </div>

      {/* Extras Grid */}
      {filteredExtras.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No extras found" : "No extras available"}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try adjusting your search query"
              : "Check back later for infographics and diagrams"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredExtras.map((extra, index) => (
            <Card
              key={extra.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openLightbox(extra, index)}
            >
              <div className="relative aspect-square bg-gray-100">
                {extra.file_type?.startsWith("image/") ? (
                  <img
                    src={extra.file_url}
                    alt={extra.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {extra.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(extra.file_size)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedExtra && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedExtra(null)}
        >
          {/* Navigation Arrows */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {selectedIndex < filteredExtras.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => setSelectedExtra(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Image Container */}
          <div
            className="max-w-[90vw] max-h-[80vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedExtra.file_url}
              alt={selectedExtra.title}
              className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white font-medium text-lg">
                {selectedExtra.title}
              </h3>
              {selectedExtra.description && (
                <p className="text-white/70 text-sm mt-1">
                  {selectedExtra.description}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-white/50 text-sm">
                  {selectedIndex + 1} of {filteredExtras.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedExtra.file_url;
                    link.download = selectedExtra.file_name;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
