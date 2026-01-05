"use client";

import {
  Heart,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  Users,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Mock data for parents
const mockParents = [
  {
    id: "1",
    name: "Jennifer Smith",
    email: "jennifer.smith@email.com",
    children: [
      { name: "Alex Smith", grade: "Grade 5" },
      { name: "Emma Smith", grade: "Grade 3" },
    ],
    notificationsEnabled: true,
    status: "active",
    joinedAt: "2024-05-10",
    lastActive: "2026-01-05",
  },
  {
    id: "2",
    name: "Robert Johnson",
    email: "r.johnson@email.com",
    children: [{ name: "Michael Johnson", grade: "Grade 8" }],
    notificationsEnabled: true,
    status: "active",
    joinedAt: "2024-07-18",
    lastActive: "2026-01-04",
  },
  {
    id: "3",
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    children: [
      { name: "Sofia Garcia", grade: "Grade 6" },
      { name: "Lucas Garcia", grade: "Grade 4" },
      { name: "Isabella Garcia", grade: "Grade 2" },
    ],
    notificationsEnabled: false,
    status: "active",
    joinedAt: "2024-02-28",
    lastActive: "2026-01-05",
  },
  {
    id: "4",
    name: "David Williams",
    email: "d.williams@email.com",
    children: [{ name: "Oliver Williams", grade: "Grade 7" }],
    notificationsEnabled: true,
    status: "pending",
    joinedAt: "2025-12-15",
    lastActive: "2025-12-20",
  },
  {
    id: "5",
    name: "Sarah Brown",
    email: "sarah.brown@email.com",
    children: [
      { name: "Ava Brown", grade: "Grade 9" },
      { name: "Noah Brown", grade: "Grade 5" },
    ],
    notificationsEnabled: true,
    status: "active",
    joinedAt: "2024-09-01",
    lastActive: "2026-01-05",
  },
];

export default function ParentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredParents = mockParents.filter((parent) => {
    const matchesSearch =
      parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.children.some((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      filterStatus === "all" || parent.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const totalChildren = mockParents.reduce(
    (acc, p) => acc + p.children.length,
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Development Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800">
            Development Completed - Awaiting Milestone 2 Approval
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            The Parents Management feature is fully developed. This feature will
            be released after Students Dashboard approval (Milestone 2).
            Currently displaying mock data for preview purposes.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-[#0794d4]" />
            Parents Management
          </h1>
          <p className="text-gray-500 mt-1">
            View and manage all registered parents
          </p>
        </div>
        <Button className="bg-[#0794d4] hover:bg-[#0680bc]" disabled>
          + Invite Parent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {mockParents.length}
              </p>
              <p className="text-sm text-gray-500">Total Parents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalChildren}
              </p>
              <p className="text-sm text-gray-500">Children Linked</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {mockParents.filter((p) => p.notificationsEnabled).length}
              </p>
              <p className="text-sm text-gray-500">Notifications On</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {mockParents.filter((p) => p.status === "pending").length}
              </p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or child name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {filterStatus === "all"
                  ? "All Status"
                  : filterStatus.charAt(0).toUpperCase() +
                    filterStatus.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Notifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(parent.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {parent.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {parent.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {parent.children.map((child, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 text-xs font-medium">
                              {child.name[0]}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">
                            {child.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {child.grade}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parent.notificationsEnabled ? (
                      <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                        <Bell className="w-3 h-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1 w-fit">
                        <Bell className="w-3 h-3" />
                        Disabled
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parent.status === "active" ? (
                      <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : parent.status === "pending" ? (
                      <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(parent.lastActive)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View Children</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Remove Parent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
