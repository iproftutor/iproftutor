"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Video,
  Image,
  CreditCard,
  Target,
  Loader2,
  GraduationCap,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface CountryPack {
  code: string;
  name: string;
  flag: string;
  currency: string;
  is_active: boolean;
  student_count: number;
  teacher_count: number;
  content_count: number;
  topic_count: number;
  question_count: number;
  flashcard_count: number;
}

export default function CountryDetailPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<CountryPack | null>(null);

  useEffect(() => {
    fetchCountry();
  }, [code]);

  const fetchCountry = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/country-packs?stats=true");
      if (response.ok) {
        const data = await response.json();
        const found = data.find((c: CountryPack) => c.code === code);
        setCountry(found || null);
      }
    } catch (error) {
      console.error("Failed to fetch country:", error);
      toast.error("Failed to load country data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Country not found</p>
        <Link href="/admin/country-packs">
          <Button variant="outline" className="mt-4">
            Back to Country Packs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/country-packs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{country.flag}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{country.name}</h1>
            <p className="text-gray-600 text-sm">
              Manage content and students for {country.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0794d4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {country.student_count || 0}
              </p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {country.teacher_count || 0}
              </p>
              <p className="text-xs text-gray-500">Teachers</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {country.content_count || 0}
              </p>
              <p className="text-xs text-gray-500">Content Items</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {country.question_count || 0}
              </p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Management */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Content Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/admin/country-packs/${code}/study-guides`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#0794d4]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#0794d4]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Study Guides</h3>
                  <p className="text-sm text-gray-500">
                    PDFs & documents for {country.name}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/country-packs/${code}/videos`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Videos</h3>
                  <p className="text-sm text-gray-500">
                    YouTube videos for {country.name}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/country-packs/${code}/extras`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Extras</h3>
                  <p className="text-sm text-gray-500">
                    Infographics & diagrams
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/country-packs/${code}/flashcards`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Flashcards</h3>
                  <p className="text-sm text-gray-500">
                    {country.flashcard_count || 0} flashcards
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/country-packs/${code}/practice`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Practice</h3>
                  <p className="text-sm text-gray-500">
                    {country.question_count || 0} questions
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* User Management */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          User Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/admin/country-packs/${code}/students`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Students</h3>
                  <p className="text-sm text-gray-500">
                    {country.student_count || 0} students enrolled
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/country-packs/${code}/settings`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-500">
                    Configure country settings
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
