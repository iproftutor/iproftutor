"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  GraduationCap,
  FileText,
  Video,
  PlusCircle,
} from "lucide-react";

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6">
        <div className="mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#0794d4] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">iP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">iProf Tutor</span>
          </Link>
        </div>

        <nav className="space-y-2">
          <Link
            href="/teachers/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#0794d4]/10 text-[#0794d4]"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/teachers/classes"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">My Classes</span>
          </Link>
          <Link
            href="/teachers/students"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Students</span>
          </Link>
          <Link
            href="/teachers/assignments"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Assignments</span>
          </Link>
          <Link
            href="/teachers/materials"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Materials</span>
          </Link>
          <Link
            href="/teachers/analytics"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link
            href="/teachers/schedule"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Schedule</span>
          </Link>
          <Link
            href="/teachers/messages"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Link
            href="/teachers/settings"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your classes and track student progress
              </p>
            </div>
            <Button className="bg-[#0794d4] hover:bg-[#0679b0] inline-flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Create New Class
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-[#0794d4]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">8</h3>
              <p className="text-sm text-gray-600">Active Classes</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">247</h3>
              <p className="text-sm text-gray-600">Total Students</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">32</h3>
              <p className="text-sm text-gray-600">Pending Reviews</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">87%</h3>
              <p className="text-sm text-gray-600">Avg Class Performance</p>
            </Card>
          </div>

          {/* Classes & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#0794d4] rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Mathematics 101
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade 8 • 32 students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#0794d4] hover:bg-[#0679b0]"
                    >
                      View
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Advanced Science
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade 10 • 28 students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#0794d4] hover:bg-[#0679b0]"
                    >
                      View
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        English Literature
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade 11 • 25 students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#0794d4] hover:bg-[#0679b0]"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-[#0794d4] hover:bg-[#0679b0]"
                  size="lg"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Assignment
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Schedule Class
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Upload Material
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message Students
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Invite Students
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Activity & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Pending Assignments
              </h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#0794d4] bg-gray-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Math Quiz - Chapter 5
                    </h3>
                    <span className="text-xs bg-[#0794d4]/10 text-[#0794d4] px-2 py-1 rounded-full">
                      32 submissions
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">15 need grading</p>
                  <Button size="sm" variant="outline">
                    Grade Now
                  </Button>
                </div>
                <div className="p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Science Lab Report
                    </h3>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                      28 submissions
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">22 need grading</p>
                  <Button size="sm" variant="outline">
                    Grade Now
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Upcoming Schedule
              </h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#0794d4] bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Mathematics 101 - Class
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">Online Session</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Today at 2:00 PM
                  </div>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Parent-Teacher Meeting
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Progress Discussion
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Nov 18, 2025 at 3:00 PM
                  </div>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    English Literature - Class
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    In-Person Session
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Tomorrow at 10:00 AM
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
