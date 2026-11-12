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
 * Calcula a sequência de ofensiva consecutiva baseando-se estritamente nas datas
 * do calendário (ciclos de 24 horas por dia).
 * Evita duplicações no mesmo dia e calcula retroativamente a partir de hoje (se concluído)
 * ou a partir de ontem (se o dia de hoje ainda não terminou).
 */
export function calculateStreakFromHistory(
  completedDates: string[],
  isTodayCompleted: boolean
): number {
  const datesSet = new Set(completedDates);
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  if (isTodayCompleted) {
    datesSet.add(todayStr);
  } else {
    datesSet.delete(todayStr);
  }

  // Se hoje está concluído, começamos a contagem retroativa a partir de hoje.
  // Se hoje não está concluído, verificamos se ontem foi concluído.
  let count = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!datesSet.has(todayStr)) {
    // Hoje não está 100% concluído.
    if (!datesSet.has(yesterdayStr)) {
      return 0; // Nem hoje nem ontem concluídos -> ofensiva zerada
    }
    // Começa a contar de ontem
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    if (datesSet.has(dateStr)) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
}

/**
 * Consolida a ofensiva para os dias já finalizados (virada da meia-noite).
 * Executa silenciosamente na inicialização do app para manter os dados corretos,
 * sem disparar popups de celebração na tela (a celebração só ocorre no momento da conclusão).
 */
export function consolidatePastDays() {
  if (typeof window === "undefined") return;

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const state = loadStreakState();
  const snapshots = loadDailySnapshots();

  // Caso 1: O dia de ontem já foi consolidado
  if (state.lastConsolidatedDate === yesterdayStr) {
    return;
  }

  // Caso 2: Ontem ainda não foi consolidado
  const yesterdaySnapshot = snapshots[yesterdayStr];

  if (yesterdaySnapshot && yesterdaySnapshot.isFullyCompleted) {
    // Ontem fechou o dia com 100% das tarefas concluídas
    const nextHistory = Array.from(new Set([...state.history, yesterdayStr]));
    const nextCount = calculateStreakFromHistory(nextHistory, false);

    const nextState: StreakState = {
      count: nextCount,
      lastConsolidatedDate: yesterdayStr,
      lastCelebratedDate: yesterdayStr,
      history: nextHistory,
    };

    saveStreakState(nextState);
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
 * Dispara a celebração e atualiza a ofensiva no momento em que o usuário
 * efetivamente conclui todas as tarefas do dia (100%).
 * Garante que a celebração só ocorra uma única vez dentro das 24h do mesmo dia.
 */
export function checkAndTriggerTodayCompletion(
  isTodayCompleted: boolean,
  totalCount: number
): boolean {
  if (typeof window === "undefined") return false;
  if (!isTodayCompleted || totalCount === 0) return false;

  const todayStr = getTodayDateString();
  const state = loadStreakState();

  // Se já foi celebrado hoje, não dispara o modal novamente
  if (state.lastCelebratedDate === todayStr) {
    return false;
  }

  const nextHistory = Array.from(new Set([...state.history, todayStr]));
  const nextCount = calculateStreakFromHistory(nextHistory, true);

  const nextState: StreakState = {
    count: nextCount,
    lastConsolidatedDate: todayStr,
    lastCelebratedDate: todayStr,
    history: nextHistory,
  };

  saveStreakState(nextState);

  // Garante snapshot do dia atual atualizado
  const snapshots = loadDailySnapshots();
  snapshots[todayStr] = {
    date: todayStr,
    totalTasks: totalCount,
    completedTasks: totalCount,
    isFullyCompleted: true,
    updatedAt: Date.now(),
  };
  saveDailySnapshots(snapshots);

  // Dispara o evento para exibir a tela de celebração
  window.dispatchEvent(
    new CustomEvent("prumo:streak-celebration", {
      detail: { streakCount: nextCount, date: todayStr },
    })
  );

  return true;
}

export interface WeekDayInfo {
  key: string;
  label: string; // "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"
  dateStr: string; // "YYYY-MM-DD"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
}

/**
 * Retorna os 7 dias da semana atual começando na Segunda-feira (Seg) até Domingo (Dom).
 * Identifica dias concluídos com base no histórico de snapshots e no dia atual.
 * Todos os dias (inclusive Domingo) são tratados de forma uniforme.
 */
export function getWeekStreakDays(isTodayCompleted: boolean): WeekDayInfo[] {
  const now = new Date();
  const todayStr = getTodayDateString();
  const currentDayOfWeek = now.getDay(); // 0: Dom, 1: Seg, ..., 6: Sáb
  const dayIndexMondayFirst = (currentDayOfWeek + 6) % 7; // Seg: 0 ... Dom: 6

  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const keys = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

  const snapshots = loadDailySnapshots();
  const streakState = loadStreakState();
  const historySet = new Set(streakState.history || []);

  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayIndexMondayFirst + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const isToday = i === dayIndexMondayFirst;
    const isPast = i < dayIndexMondayFirst;
    const isFuture = i > dayIndexMondayFirst;

    let isCompleted = false;
    if (isToday) {
      isCompleted = isTodayCompleted;
    } else if (isPast) {
      const snap = snapshots[dateStr];
      isCompleted = snap?.isFullyCompleted === true || historySet.has(dateStr);
    } else {
      isCompleted = false;
    }

    days.push({
      key: keys[i],
      label: labels[i],
      dateStr,
      isToday,
      isPast,
      isFuture,
      isCompleted,
    });
  }

  return days;
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
  const nextHistory = Array.from(new Set([...state.history, yesterdayStr]));
  const nextCount = calculateStreakFromHistory(nextHistory, false);

  const nextState: StreakState = {
    count: nextCount,
    lastConsolidatedDate: yesterdayStr,
    lastCelebratedDate: yesterdayStr,
    history: nextHistory,
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

  const isInitialMountRef = useRef(true);
  const prevIsTodayCompletedRef = useRef(false);

  // 1. Atualiza o snapshot do dia atual e recalcula a ofensiva de forma determinística
  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();
    const snapshots = loadDailySnapshots();
    const state = loadStreakState();

    snapshots[todayStr] = {
      date: todayStr,
      totalTasks: totalCount,
      completedTasks: completedCount,
      isFullyCompleted: isTodayCompleted,
      updatedAt: Date.now(),
    };

    saveDailySnapshots(snapshots);

    if (isTodayCompleted) {
      // Garante que o dia de hoje está no histórico
      const nextHistory = Array.from(new Set([...state.history, todayStr]));
      const nextCount = calculateStreakFromHistory(nextHistory, true);

      if (state.count !== nextCount || state.lastConsolidatedDate !== todayStr) {
        saveStreakState({
          ...state,
          count: nextCount,
          lastConsolidatedDate: todayStr,
          history: nextHistory,
        });
      }

      // Dispara a tela de celebração apenas na transição para concluído e uma vez por dia
      if (!isInitialMountRef.current && !prevIsTodayCompletedRef.current) {
        checkAndTriggerTodayCompletion(isTodayCompleted, totalCount);
      }
    } else {
      // Se hoje deixou de ser 100% concluído (desmarcou tarefa ou adicionou nova tarefa pendente):
      // Remove o dia de hoje do histórico ativo e recalcula a sequência retroativa
      if (state.history.includes(todayStr) || state.lastConsolidatedDate === todayStr) {
        const nextHistory = state.history.filter((d) => d !== todayStr);
        const nextCount = calculateStreakFromHistory(nextHistory, false);
        saveStreakState({
          ...state,
          count: nextCount,
          lastConsolidatedDate: nextHistory.includes(yesterdayStr) ? yesterdayStr : null,
          history: nextHistory,
        });
      }
    }

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
    }
    prevIsTodayCompletedRef.current = isTodayCompleted;
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
