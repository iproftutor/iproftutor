"use client";

import { usePomodoroContext } from "./PomodoroProvider";
import { Timer, Zap } from "lucide-react";

// Small indicator to show pomodoro status in navbar or sidebar
export function PomodoroIndicator() {
  const { state, loading } = usePomodoroContext();

  if (loading || !state) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const studyRemaining = state.studyDurationSeconds - state.studyElapsedSeconds;
  const progress =
    (state.studyElapsedSeconds / state.studyDurationSeconds) * 100;

  if (state.isLocked) {
    return null; // Don't show when locked (overlay is visible)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-lg">
      <div className="relative">
        <Timer className="w-4 h-4 text-purple-600" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-purple-700">
          {formatTime(studyRemaining)}
        </span>
        <div className="w-16 h-1 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-purple-600">
        <Zap className="w-3 h-3" />
        <span>{state.cyclesCompleted}/4</span>
      </div>
    </div>
  );
}
