"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function AdminUnauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unauthorized Access
        </h1>

        <p className="text-gray-500 mb-6">
          You don&apos;t have permission to access this page. Please sign in
          with admin credentials to continue.
        </p>

        <div className="space-y-3">
          <Link href="/admin/sign-in">
            <Button className="w-full bg-[#0794d4] hover:bg-[#0680bc] text-white mb-3">
              Sign In as Admin
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
