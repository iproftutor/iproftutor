"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
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

export default function CountryPacksPage() {
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<CountryPack[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryPack | null>(
    null
  );
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    flag: "",
    currency: "USD",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/country-packs?stats=true");
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      toast.error("Failed to load country packs");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = editingCountry ? "PUT" : "POST";
      const body = editingCountry
        ? { ...formData, id: (editingCountry as any).id }
        : formData;

      const response = await fetch("/api/country-packs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingCountry ? "Country updated" : "Country added");
        setShowAddModal(false);
        setEditingCountry(null);
        setFormData({ code: "", name: "", flag: "", currency: "USD" });
        fetchCountries();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save country");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (country: CountryPack) => {
    try {
      const response = await fetch("/api/country-packs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: (country as any).id,
          is_active: !country.is_active,
        }),
      });

      if (response.ok) {
        toast.success(
          country.is_active ? "Country deactivated" : "Country activated"
        );
        fetchCountries();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (country: CountryPack) => {
    if (
      !confirm(
        `Are you sure you want to delete ${country.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/country-packs?id=${(country as any).id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Country deleted");
        fetchCountries();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete country");
    }
  };

  const openEditModal = (country: CountryPack) => {
    setEditingCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      flag: country.flag || "",
      currency: country.currency || "USD",
    });
    setShowAddModal(true);
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = countries.reduce(
    (sum, c) => sum + (c.student_count || 0),
    0
  );
  const totalContent = countries.reduce(
    (sum, c) => sum + (c.content_count || 0),
    0
  );
  const activeCountries = countries.filter((c) => c.is_active).length;

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
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Country Packs</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage regional content and student groups
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCountry(null);
            setFormData({ code: "", name: "", flag: "", currency: "USD" });
            setShowAddModal(true);
          }}
          className="bg-[#0794d4] hover:bg-[#0678ab]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Country
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#0794d4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeCountries}
              </p>
              <p className="text-xs text-gray-500">Active Countries</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalContent}</p>
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
                {countries.reduce((sum, c) => sum + (c.question_count || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((country) => (
          <Card
            key={country.code}
            className={`p-5 ${!country.is_active ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{country.flag}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {country.name}
                  </h3>
                  <p className="text-sm text-gray-500">{country.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(country)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title={country.is_active ? "Deactivate" : "Activate"}
                >
                  {country.is_active ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => openEditModal(country)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(country)}
                  className="p-1.5 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-900">
                  {country.student_count || 0}
                </p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-900">
                  {country.content_count || 0}
                </p>
                <p className="text-xs text-gray-500">Content</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Target className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-gray-900">
                  {country.question_count || 0}
                </p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Link
                href={`/admin/country-packs/${country.code}/students`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="w-4 h-4 mr-1" />
                  Students
                </Button>
              </Link>
              <Link
                href={`/admin/country-packs/${country.code}/content`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Content
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No countries found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingCountry ? "Edit Country" : "Add Country"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCountry(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Country Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="US"
                    maxLength={3}
                    disabled={!!editingCountry}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="flag">Flag Emoji</Label>
                  <Input
                    id="flag"
                    value={formData.flag}
                    onChange={(e) =>
                      setFormData({ ...formData, flag: e.target.value })
                    }
                    placeholder="🇺🇸"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Country Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="United States"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="USD"
                  maxLength={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCountry(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.code || !formData.name}
                  className="flex-1 bg-[#0794d4] hover:bg-[#0678ab]"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {editingCountry ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
