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
  Users,
  Mail,
  Calendar,
  Loader2,
  GraduationCap,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  email: string;
  grade_level: string;
  age: number;
  created_at: string;
  onboarding_completed_at: string;
  parent_confirmed: boolean;
}

export default function CountryStudentsPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    fetchCountryName();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/students?country_code=${code}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const grades = [
    ...new Set(students.map((s) => s.grade_level).filter(Boolean)),
  ];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = !gradeFilter || s.grade_level === gradeFilter;
    return matchesSearch && matchesGrade;
  });

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
      <div className="flex items-center gap-4">
        <Link href={`/admin/country-packs/${code}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 text-sm mt-1">
            {students.length} students in {countryName}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white"
        >
          <option value="">All Grades</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-green-600">
            {students.filter((s) => s.parent_confirmed).length}
          </p>
          <p className="text-xs text-gray-500">Parent Confirmed</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-yellow-600">
            {students.filter((s) => !s.parent_confirmed).length}
          </p>
          <p className="text-xs text-gray-500">Pending Confirmation</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          <p className="text-xs text-gray-500">Grade Levels</p>
        </Card>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">No students found</h3>
          <p className="text-sm text-gray-500">
            {students.length === 0
              ? `No students have registered from ${countryName} yet`
              : "No students match your search criteria"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0794d4]/10 rounded-full flex items-center justify-center">
                    <span className="text-[#0794d4] font-semibold">
                      {student.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {student.full_name || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">
                      {student.grade_level || "-"}
                    </p>
                    <p className="text-xs text-gray-500">Grade</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">
                      {student.age || "-"}
                    </p>
                    <p className="text-xs text-gray-500">Age</p>
                  </div>
                  <div className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        student.parent_confirmed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {student.parent_confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">
                      {student.created_at && formatDate(student.created_at)}
                    </p>
                    <p className="text-xs text-gray-500">Joined</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
