"use client";

import { usePomodoroContext } from "./PomodoroProvider";
import { Coffee, Timer, Brain, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function PomodoroLockOverlay() {
  const { state, loading } = usePomodoroContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading || !state?.isLocked) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isLongBreak = state.lockType === "long";
  const totalSeconds = isLongBreak
    ? state.longBreakSeconds
    : state.shortBreakSeconds;
  const progress =
    ((totalSeconds - state.lockRemainingSeconds) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-9999 bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="mb-8">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              {isLongBreak ? (
                <Coffee className="w-12 h-12 text-amber-400" />
              ) : (
                <Brain className="w-12 h-12 text-purple-400" />
              )}
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          {isLongBreak ? "Time for a Long Break!" : "Quick Break Time!"}
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-300 mb-8">
          {isLongBreak
            ? "You've completed 4 study cycles! Take a well-deserved 30-minute break. Stretch, hydrate, and rest your eyes."
            : "Great work! Take a 5-minute break to refresh your mind. Stand up, stretch, or grab some water."}
        </p>

        {/* Timer */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
            <Timer className="w-8 h-8 text-white/80" />
            <span className="text-5xl font-mono font-bold text-white">
              {formatTime(state.lockRemainingSeconds)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 text-sm text-gray-400">
          <div>
            <span className="block text-2xl font-bold text-white">
              {state.cyclesCompleted}
            </span>
            <span>Cycles Today</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-white">
              {state.totalStudyTimeToday}
            </span>
            <span>Minutes Studied</span>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">
            💡 <strong className="text-gray-300">Break Tip:</strong>{" "}
            {isLongBreak
              ? "Consider going for a short walk or doing some light exercises to boost your energy."
              : "Look away from the screen and focus on something 20 feet away for 20 seconds (20-20-20 rule)."}
          </p>
        </div>
      </div>
    </div>
  );
}
