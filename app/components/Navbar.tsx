"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[70%] max-w-6xl bg-white/90 backdrop-blur-lg z-50 border border-gray-200 rounded-full shadow-lg px-6">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0794d4] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">iP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">iProf Tutor</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-gray-600 hover:text-[#0794d4] transition-colors"
          >
            Features
          </Link>
          <Link
            href="#dashboards"
            className="text-gray-600 hover:text-[#0794d4] transition-colors"
          >
            Dashboards
          </Link>
          <Link
            href="#testimonials"
            className="text-gray-600 hover:text-[#0794d4] transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 hover:text-[#0794d4] transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <Link href="/auth/sign-in">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-[#0794d4] rounded-full"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/auth/get-started">
            <Button className="bg-[#0794d4] hover:bg-[#0679b0] text-white rounded-full">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
