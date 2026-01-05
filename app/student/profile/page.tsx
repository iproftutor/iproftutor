"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Globe,
  GraduationCap,
  School,
  Calendar,
  Phone,
  Clock,
  Bell,
  Camera,
  Save,
  Loader2,
  Shield,
  CheckCircle2,
  Languages,
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  email_verified: boolean;
  provider: string;
  created_at: string;
  last_sign_in: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  language: string;
  country: string | null;
  grade_level: string | null;
  school_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    weekly_report: boolean;
  };
  updated_at: string;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "pt", name: "Portuguese" },
  { code: "ur", name: "Urdu" },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Pakistan",
  "China",
  "Japan",
  "Brazil",
  "Mexico",
  "South Africa",
  "Nigeria",
  "Egypt",
  "Saudi Arabia",
  "UAE",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Other",
];

const GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris, Berlin" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Karachi", label: "Pakistan (PKT)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    language: "en",
    country: "",
    grade_level: "",
    school_name: "",
    date_of_birth: "",
    phone: "",
    timezone: "UTC",
    notification_preferences: {
      email: true,
      push: true,
      weekly_report: true,
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          language: data.language || "en",
          country: data.country || "",
          grade_level: data.grade_level || "",
          school_name: data.school_name || "",
          date_of_birth: data.date_of_birth || "",
          phone: data.phone || "",
          timezone: data.timezone || "UTC",
          notification_preferences: data.notification_preferences || {
            email: true,
            push: true,
            weekly_report: true,
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        fetchProfile();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: data.avatar_url } : null
        );
        toast.success("Avatar updated");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0794d4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#0794d4] flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(profile?.full_name || "U")}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 border"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.full_name || "User"}
            </h2>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <Mail className="w-4 h-4" />
              {profile?.email}
              {profile?.email_verified && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
              )}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                {profile?.role
                  ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                  : ""}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {profile?.created_at && formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info (Read-only) */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          Account Information
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          These details are managed by your authentication provider and cannot
          be changed here.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-500">Email Address</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
              {profile?.email}
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Sign-in Provider</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700 capitalize">
              {profile?.provider || "Email"}
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Account Created</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
              {profile?.created_at && formatDate(profile.created_at)}
            </div>
          </div>
          <div>
            <Label className="text-gray-500">Last Sign-in</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
              {profile?.last_sign_in && formatDate(profile.last_sign_in)}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information (Editable) */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 234 567 8900"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="school_name">School / Institution</Label>
            <Input
              id="school_name"
              value={formData.school_name}
              onChange={(e) =>
                setFormData({ ...formData, school_name: e.target.value })
              }
              placeholder="Enter your school name"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Regional Settings */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-500" />
          Regional Settings
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="grade_level">Grade Level</Label>
            <select
              id="grade_level"
              value={formData.grade_level}
              onChange={(e) =>
                setFormData({ ...formData, grade_level: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select grade</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive updates and reminders via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notification_preferences.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    email: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded text-[#0794d4]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">
                Get instant notifications in your browser
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notification_preferences.push}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    push: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded text-[#0794d4]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">
                Weekly Progress Report
              </p>
              <p className="text-sm text-gray-500">
                Receive a summary of your weekly activity
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notification_preferences.weekly_report}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    weekly_report: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded text-[#0794d4]"
            />
          </label>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0794d4] hover:bg-[#0678ab] px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
