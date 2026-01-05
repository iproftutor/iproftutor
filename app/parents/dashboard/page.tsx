"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Bell,
  Calendar,
  Award,
  BookOpen,
  LogOut,
  Settings,
  Home,
  BarChart3,
  MessageSquare,
} from "lucide-react";

export default function ParentDashboard() {
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
            href="/parents/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#0794d4]/10 text-[#0794d4]"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/parents/children"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">My Children</span>
          </Link>
          <Link
            href="/parents/progress"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Progress Reports</span>
          </Link>
          <Link
            href="/parents/schedule"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Schedule</span>
          </Link>
          <Link
            href="/parents/messages"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </Link>
          <Link
            href="/parents/notifications"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Link
            href="/parents/settings"
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Parent Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor your children's learning progress and achievements
            </p>
          </div>

          {/* Children Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-l-4 border-[#0794d4]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Emma Johnson
                  </h3>
                  <p className="text-sm text-gray-600">Grade 8</p>
                </div>
                <div className="w-12 h-12 bg-[#0794d4]/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#0794d4]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0794d4] h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-4 bg-[#0794d4] hover:bg-[#0679b0]"
              >
                View Details
              </Button>
            </Card>

            <Card className="p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Alex Johnson
                  </h3>
                  <p className="text-sm text-gray-600">Grade 5</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "92%" }}
                  ></div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-4 bg-[#0794d4] hover:bg-[#0679b0]"
              >
                View Details
              </Button>
            </Card>

            <Card className="p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sophia Johnson
                  </h3>
                  <p className="text-sm text-gray-600">Grade 11</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: "78%" }}
                  ></div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-4 bg-[#0794d4] hover:bg-[#0679b0]"
              >
                View Details
              </Button>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#0794d4]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">24</h3>
              <p className="text-sm text-gray-600">Active Courses</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">85%</h3>
              <p className="text-sm text-gray-600">Avg Performance</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">47</h3>
              <p className="text-sm text-gray-600">Total Achievements</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">5</h3>
              <p className="text-sm text-gray-600">New Notifications</p>
            </Card>
          </div>

          {/* Recent Activity & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-[#0794d4] rounded-full flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Emma earned a new badge!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Math Master - Completed all Chapter 5 exercises
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Alex improved performance
                    </h3>
                    <p className="text-sm text-gray-600">
                      Science quiz score: 95% (up from 82%)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Sophia started new course
                    </h3>
                    <p className="text-sm text-gray-600">
                      Advanced Biology - College Prep
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#0794d4] bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Parent-Teacher Conference
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Emma's Math Progress Review
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Nov 18, 2025 at 3:00 PM
                  </div>
                </div>
                <div className="p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Assignment Due
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Alex - Science Project Presentation
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Nov 16, 2025
                  </div>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-gray-50 rounded-r-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    School Event
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Sophia - College Fair
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Nov 22, 2025
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
