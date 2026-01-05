"use client";

import { Card } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  Activity,
  UserCog,
  BookOpen,
  Video,
  Image,
  CreditCard,
  Target,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const isDev = process.env.NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION === "true";

  return (
    <>
      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <span className="bg-yellow-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
            Dev Mode
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0794d4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Teachers</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserCog className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">99.9%</p>
              <p className="text-xs text-gray-500">Uptime</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Content Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/content/study-guides">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#0794d4]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0794d4]/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#0794d4]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Study Guides</h3>
                  <p className="text-sm text-gray-500">
                    Upload PDFs & documents
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/content/videos">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Videos</h3>
                  <p className="text-sm text-gray-500">Add YouTube videos</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/content/extras">
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

          <Link href="/admin/content/flashcards">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Flashcards</h3>
                  <p className="text-sm text-gray-500">
                    Create study flashcards
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/content/practice">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Practice</h3>
                  <p className="text-sm text-gray-500">
                    Manage practice questions
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/country-packs">
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-cyan-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Country Packs</h3>
                  <p className="text-sm text-gray-500">
                    Manage regional content
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">API</p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auth</p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Storage</p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
