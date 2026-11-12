"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Task } from "@/lib/db";

export interface DaySnapshot {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  isFullyCompleted: boolean;
  updatedAt: number;
}

export interface StreakState {
  count: number;
  lastConsolidatedDate: string | null;
  lastCelebratedDate: string | null;
  history: string[];
}

const STREAK_STATE_KEY = "prumo_streak_state_v3";
const SNAPSHOTS_KEY = "prumo_daily_snapshots_v3";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(`${dateStr1}T00:00:00`);
  const d2 = new Date(`${dateStr2}T00:00:00`);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function loadStreakState(): StreakState {
  if (typeof window === "undefined") {
    return { count: 0, lastConsolidatedDate: null, lastCelebratedDate: null, history: [] };
  }
  try {
    const raw = localStorage.getItem(STREAK_STATE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { count: 0, lastConsolidatedDate: null, lastCelebratedDate: null, history: [] };
}

export function saveStreakState(state: StreakState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STREAK_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("prumo:streak-updated"));
  } catch (err) {
    console.error("Erro ao salvar streak state:", err);
  }
}

export function loadDailySnapshots(): Record<string, DaySnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {};
}

export function saveDailySnapshots(snapshots: Record<string, DaySnapshot>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch (err) {
    console.error("Erro ao salvar daily snapshots:", err);
  }
}

/**
 * Consolida a ofensiva para os dias já finalizados (virada da meia-noite).
 * O dia de hoje nunca é contado nem celebra antes de terminar.
 */
export function consolidatePastDays() {
  if (typeof window === "undefined") return;

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const state = loadStreakState();
  const snapshots = loadDailySnapshots();

  // Caso 1: O dia de ontem já foi consolidado
  if (state.lastConsolidatedDate === yesterdayStr) {
    // Se ainda não celebrou o dia conquistado na tela, dispara ao abrir no novo dia
    if (state.lastCelebratedDate !== yesterdayStr && state.count > 0) {
      state.lastCelebratedDate = yesterdayStr;
      saveStreakState(state);
      window.dispatchEvent(
        new CustomEvent("prumo:streak-celebration", {
          detail: { streakCount: state.count, date: yesterdayStr },
        })
      );
    }
    return;
  }

  // Caso 2: Ontem ainda não foi consolidado
  const yesterdaySnapshot = snapshots[yesterdayStr];

  if (yesterdaySnapshot && yesterdaySnapshot.isFullyCompleted) {
    // Ontem fechou o dia com 100% das tarefas concluídas
    let nextCount = 1;

    if (state.lastConsolidatedDate) {
      const diff = getDaysDifference(state.lastConsolidatedDate, yesterdayStr);
      if (diff === 1) {
        nextCount = state.count + 1;
      } else {
        nextCount = 1;
      }
    } else {
      nextCount = 1;
    }

    const nextHistory = Array.from(new Set([...state.history, yesterdayStr]));
    const nextState: StreakState = {
      count: nextCount,
      lastConsolidatedDate: yesterdayStr,
      lastCelebratedDate: yesterdayStr,
      history: nextHistory,
    };

    saveStreakState(nextState);

    // Dispara a animação comemorativa do dia anterior conquistado
    window.dispatchEvent(
      new CustomEvent("prumo:streak-celebration", {
        detail: { streakCount: nextCount, date: yesterdayStr },
      })
    );
  } else {
    // Ontem não foi 100% concluído ou não houve snapshot
    if (state.lastConsolidatedDate) {
      const diff = getDaysDifference(state.lastConsolidatedDate, todayStr);
      if (diff > 1 && state.count > 0) {
        // Sequência foi interrompida
        saveStreakState({
          ...state,
          count: 0,
        });
      }
    }
  }
}

/**
 * Permite simular o fechamento do dia (útil para testes imediatos sem precisar esperar a meia-noite).
 */
export function simulateDayClosingForTesting(): boolean {
  if (typeof window === "undefined") return false;

  const todayStr = getTodayDateString();
  const snapshots = loadDailySnapshots();
  const todaySnapshot = snapshots[todayStr];

  if (!todaySnapshot || !todaySnapshot.isFullyCompleted) {
    return false;
  }

  const yesterdayStr = getYesterdayDateString();
  snapshots[yesterdayStr] = {
    ...todaySnapshot,
    date: yesterdayStr,
  };
  saveDailySnapshots(snapshots);

  const state = loadStreakState();
  const nextCount = state.count + 1;
  const nextState: StreakState = {
    count: nextCount,
    lastConsolidatedDate: yesterdayStr,
    lastCelebratedDate: yesterdayStr,
    history: Array.from(new Set([...state.history, yesterdayStr])),
  };
  saveStreakState(nextState);

  window.dispatchEvent(
    new CustomEvent("prumo:streak-celebration", {
      detail: { streakCount: nextCount, date: yesterdayStr },
    })
  );

  return true;
}

function loadStreakCountSnapshot(): number {
  return loadStreakState().count;
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
  const streakCount = useSyncExternalStore(subscribeStreak, loadStreakCountSnapshot, () => 0);

  const totalCount = todayTasks.length;
  const completedCount = todayTasks.filter((t) => t.status === "completed").length;
  const isTodayCompleted = totalCount > 0 && completedCount === totalCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 1. Atualiza o snapshot do dia atual em segundo plano
  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayStr = getTodayDateString();
    const snapshots = loadDailySnapshots();

    snapshots[todayStr] = {
      date: todayStr,
      totalTasks: totalCount,
      completedTasks: completedCount,
      isFullyCompleted: isTodayCompleted,
      updatedAt: Date.now(),
    };

    saveDailySnapshots(snapshots);
  }, [totalCount, completedCount, isTodayCompleted]);

  // 2. Consolidação automática de dias anteriores na montagem e na virada da meia-noite
  useEffect(() => {
    consolidatePastDays();

    let lastKnownDate = getTodayDateString();
    const interval = setInterval(() => {
      const currentDate = getTodayDateString();
      if (currentDate !== lastKnownDate) {
        lastKnownDate = currentDate;
        consolidatePastDays();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    streakCount,
    isTodayCompleted,
    completionPercentage,
    completedCount,
    totalCount,
    simulateDayClosing: simulateDayClosingForTesting,
  };
}
