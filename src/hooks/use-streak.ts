"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Task } from "@/lib/db";
import { toast } from "sonner";

interface StreakData {
  count: number;
  lastCompletedDate: string | null;
  history: string[];
}

const STORAGE_KEY = "prumo_streak_data";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadStreakFromStorage(): number {
  if (typeof window === "undefined") return 3;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: StreakData = JSON.parse(stored);
      const todayStr = getTodayDateString();
      const yesterdayStr = getYesterdayDateString();

      if (parsed.lastCompletedDate === todayStr || parsed.lastCompletedDate === yesterdayStr) {
        return parsed.count;
      }
      return 0;
    }
  } catch {
    // fallback
  }
  return 3;
}

function subscribeStreak(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("prumo:streak-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("prumo:streak-updated", callback);
  };
}

export function useStreak(todayTasks: Task[]) {
  const streakCount = useSyncExternalStore(subscribeStreak, loadStreakFromStorage, () => 3);
  const hasTriggeredRef = useRef<boolean>(false);

  const totalCount = todayTasks.length;
  const completedCount = todayTasks.filter((t) => t.status === "completed").length;
  const isTodayCompleted = totalCount > 0 && completedCount === totalCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayStr = getTodayDateString();

    if (isTodayCompleted && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      // Dispara o evento de conclusão do dia
      const event = new CustomEvent("prumo:day-completed", {
        detail: {
          date: todayStr,
          totalTasks: totalCount,
          completedTasks: completedCount,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let nextStreak = 1;
        let history: string[] = [todayStr];

        if (stored) {
          const parsed: StreakData = JSON.parse(stored);
          const yesterdayStr = getYesterdayDateString();

          if (parsed.lastCompletedDate === yesterdayStr) {
            nextStreak = parsed.count + 1;
          } else if (parsed.lastCompletedDate === todayStr) {
            nextStreak = parsed.count;
          } else {
            nextStreak = 1;
          }

          history = Array.from(new Set([...(parsed.history || []), todayStr]));
        }

        const updatedData: StreakData = {
          count: nextStreak,
          lastCompletedDate: todayStr,
          history,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        window.dispatchEvent(new Event("prumo:streak-updated"));

        toast.success("🔥 Ofensiva mantida com sucesso!", {
          description: `100% das tarefas de hoje foram concluídas! Sua ofensiva agora é de ${nextStreak} dias consecutivos.`,
          duration: 5000,
        });
      } catch (err) {
        console.error("Erro ao registrar conclusão do dia:", err);
      }
    } else if (!isTodayCompleted) {
      hasTriggeredRef.current = false;
    }
  }, [isTodayCompleted, totalCount, completedCount]);

  return {
    streakCount,
    isTodayCompleted,
    completionPercentage,
    completedCount,
    totalCount,
  };
}
