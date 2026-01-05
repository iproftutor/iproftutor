"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

// Check if Pomodoro is disabled via env var
const POMODORO_DISABLED = process.env.NEXT_PUBLIC_DISABLE_POMODORO === "true";

interface PomodoroState {
  isLocked: boolean;
  lockType: "short" | "long" | null;
  lockRemainingSeconds: number;
  studyElapsedSeconds: number;
  cyclesCompleted: number;
  totalStudyTimeToday: number;
  studyDurationSeconds: number;
  shortBreakSeconds: number;
  longBreakSeconds: number;
  cyclesForLongBreak: number;
}

interface PomodoroContextType {
  state: PomodoroState | null;
  loading: boolean;
  refreshState: () => Promise<void>;
}

const defaultState: PomodoroState = {
  isLocked: false,
  lockType: null,
  lockRemainingSeconds: 0,
  studyElapsedSeconds: 0,
  cyclesCompleted: 0,
  totalStudyTimeToday: 0,
  studyDurationSeconds: 25 * 60,
  shortBreakSeconds: 5 * 60,
  longBreakSeconds: 30 * 60,
  cyclesForLongBreak: 4,
};

const PomodoroContext = createContext<PomodoroContextType>({
  state: null,
  loading: true,
  refreshState: async () => {},
});

export function usePomodoroContext() {
  return useContext(PomodoroContext);
}

interface PomodoroProviderProps {
  children: ReactNode;
}

export function PomodoroProvider({ children }: PomodoroProviderProps) {
  const [state, setState] = useState<PomodoroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // If Pomodoro is disabled, render children without any tracking
  if (POMODORO_DISABLED) {
    return (
      <PomodoroContext.Provider
        value={{
          state: { ...defaultState },
          loading: false,
          refreshState: async () => {},
        }}
      >
        {children}
      </PomodoroContext.Provider>
    );
  }

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (!user) {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (!session?.user) {
        setState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch pomodoro state from server
  const fetchState = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/pomodoro");
      if (response.ok) {
        const data = await response.json();
        setState(data);
      }
    } catch (error) {
      console.error("Failed to fetch pomodoro state:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchState();
    }
  }, [isAuthenticated, fetchState]);

  // Poll for state updates every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchState]);

  // Local countdown timer for smooth UI
  useEffect(() => {
    if (!state || !isAuthenticated) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;

        if (prev.isLocked && prev.lockRemainingSeconds > 0) {
          const newRemaining = prev.lockRemainingSeconds - 1;

          // If lock just expired, refresh from server
          if (newRemaining <= 0) {
            fetchState();
            return prev;
          }

          return {
            ...prev,
            lockRemainingSeconds: newRemaining,
          };
        }

        if (!prev.isLocked) {
          const newElapsed = prev.studyElapsedSeconds + 1;

          // Check if study time reached (25 minutes)
          if (newElapsed >= prev.studyDurationSeconds) {
            // Trigger lock
            triggerLock();
            return prev;
          }

          return {
            ...prev,
            studyElapsedSeconds: newElapsed,
          };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, isAuthenticated, fetchState]);

  // Trigger lock when study time is complete
  const triggerLock = async () => {
    try {
      const response = await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_lock" }),
      });

      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error("Failed to trigger lock:", error);
    }
  };

  const refreshState = useCallback(async () => {
    await fetchState();
  }, [fetchState]);

  return (
    <PomodoroContext.Provider value={{ state, loading, refreshState }}>
      {children}
    </PomodoroContext.Provider>
  );
}
