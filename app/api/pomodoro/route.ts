import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Get current pomodoro state
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pomodoro state
    const { data, error } = await supabase.rpc("get_pomodoro_state", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error getting pomodoro state:", error);
      return NextResponse.json(
        { error: "Failed to get pomodoro state" },
        { status: 500 }
      );
    }

    const state = data?.[0] || null;

    return NextResponse.json({
      isLocked: state?.is_locked || false,
      lockType: state?.lock_type || null,
      lockRemainingSeconds: state?.lock_remaining_seconds || 0,
      studyElapsedSeconds: state?.study_elapsed_seconds || 0,
      cyclesCompleted: state?.cycles_completed || 0,
      totalStudyTimeToday: state?.total_study_time_today || 0,
      studyDurationSeconds: 25 * 60, // 25 minutes
      shortBreakSeconds: 5 * 60, // 5 minutes
      longBreakSeconds: 30 * 60, // 30 minutes
      cyclesForLongBreak: 4,
    });
  } catch (error: any) {
    console.error("Pomodoro GET error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Trigger lock after study session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "trigger_lock") {
      // Trigger lock after 25 min study
      const { data, error } = await supabase.rpc("trigger_pomodoro_lock", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error triggering lock:", error);
        return NextResponse.json(
          { error: "Failed to trigger lock" },
          { status: 500 }
        );
      }

      const result = data?.[0];
      return NextResponse.json({
        success: result?.success || false,
        lockType: result?.lock_type,
        lockDurationMinutes: result?.lock_duration_minutes,
        cyclesCompleted: result?.cycles_completed,
      });
    }

    if (action === "reset_study") {
      // Reset study timer (e.g., after returning from being idle)
      const { error } = await supabase
        .from("pomodoro_tracking")
        .update({
          study_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error resetting study:", error);
        return NextResponse.json(
          { error: "Failed to reset study" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Pomodoro POST error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
