"use client";

import { useAdmin } from "../context/AdminContext";
import { ChevronDown, Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminHeader() {
  const { selectedCountry, setSelectedCountry, countries, loadingCountries } =
    useAdmin();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-2">
      {/* Left side - Page title area (can be used by child pages) */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm text-gray-500">Content Management</h2>
      </div>

      {/* Right side - Country selector */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-2 bg-linear-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg hover:from-cyan-100 hover:to-blue-100 transition-all">
              {loadingCountries ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </>
              ) : selectedCountry ? (
                <>
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCountry.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedCountry.code} • {selectedCountry.currency}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Select Country</span>
                </>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Select Country Pack
            </DropdownMenuLabel>
            <div className="px-2 py-2">
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <DropdownMenuItem
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country);
                      setSearchQuery("");
                    }}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <div>
                        <p className="text-sm font-medium">{country.name}</p>
                        <p className="text-xs text-gray-500">{country.code}</p>
                      </div>
                    </div>
                    {selectedCountry?.code === country.code && (
                      <Check className="w-4 h-4 text-cyan-600" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
