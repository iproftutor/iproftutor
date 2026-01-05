"use client";

import SidePanel from "./components/SidePanel";
import { usePathname } from "next/navigation";
import { PomodoroProvider, PomodoroLockOverlay } from "@/components/pomodoro";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullWidth = pathname?.includes("/iprof-tutor");

  return (
    <PomodoroProvider>
      <div className="flex min-h-screen bg-gray-50 overflow-hidden">
        <SidePanel />
        <main
          className={`flex-1 ml-64 transition-all duration-300 ${
            isFullWidth ? "h-screen overflow-hidden" : "p-8"
          }`}
        >
          <div className={isFullWidth ? "h-full" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        </main>
      </div>
      <PomodoroLockOverlay />
    </PomodoroProvider>
  );
}
