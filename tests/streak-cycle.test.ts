import { describe, it, expect, beforeEach, beforeAll } from "vitest";

// Mock de localStorage e CustomEvent para ambiente Node no Vitest
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

beforeAll(() => {
  (globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;
  if (!globalThis.window) {
    (globalThis as unknown as { window: unknown }).window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };
  }
});

import {
  getTodayDateString,
  getYesterdayDateString,
  getDaysDifference,
  loadStreakState,
  saveStreakState,
  saveDailySnapshots,
  consolidatePastDays,
  simulateDayClosingForTesting,
  checkAndTriggerTodayCompletion,
  getWeekStreakDays,
  calculateStreakFromHistory,
} from "@/hooks/use-streak";

describe("Daily Streak Cycle Business Rules", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should calculate correct day differences and date strings", () => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getDaysDifference(yesterday, today)).toBe(1);
    expect(getDaysDifference("2026-11-10", "2026-11-12")).toBe(2);
  });

  it("should not increment streak or celebrate during the current day even if 100% completed", () => {
    const todayStr = getTodayDateString();
    const snapshots = {
      [todayStr]: {
        date: todayStr,
        totalTasks: 4,
        completedTasks: 4,
        isFullyCompleted: true,
        updatedAt: Date.now(),
      },
    };
    saveDailySnapshots(snapshots);

    // Roda consolidação - o dia de hoje não deve ser consolidado ainda
    consolidatePastDays();

    const state = loadStreakState();
    expect(state.count).toBe(0);
    expect(state.lastConsolidatedDate).toBeNull();
  });

  it("should consolidate yesterday when it was 100% completed and advance streak count", () => {
    const yesterdayStr = getYesterdayDateString();
    const snapshots = {
      [yesterdayStr]: {
        date: yesterdayStr,
        totalTasks: 3,
        completedTasks: 3,
        isFullyCompleted: true,
        updatedAt: Date.now() - 86400000,
      },
    };
    saveDailySnapshots(snapshots);

    consolidatePastDays();

    const state = loadStreakState();
    expect(state.count).toBe(1);
    expect(state.lastConsolidatedDate).toBe(yesterdayStr);
    expect(state.lastCelebratedDate).toBe(yesterdayStr);
    expect(state.history).toContain(yesterdayStr);
  });

  it("should reset streak if yesterday was not fully completed", () => {
    const yesterdayStr = getYesterdayDateString();
    // Suponha que tínhamos 2 dias consolidados antes
    const state = {
      count: 2,
      lastConsolidatedDate: "2026-11-08",
      lastCelebratedDate: "2026-11-08",
      history: ["2026-11-07", "2026-11-08"],
    };
    saveStreakState(state);

    const snapshots = {
      [yesterdayStr]: {
        date: yesterdayStr,
        totalTasks: 5,
        completedTasks: 3,
        isFullyCompleted: false,
        updatedAt: Date.now() - 86400000,
      },
    };
    saveDailySnapshots(snapshots);

    consolidatePastDays();

    const updatedState = loadStreakState();
    expect(updatedState.count).toBe(0);
  });

  it("should allow testing simulation of day closing", () => {
    const todayStr = getTodayDateString();
    saveDailySnapshots({
      [todayStr]: {
        date: todayStr,
        totalTasks: 4,
        completedTasks: 4,
        isFullyCompleted: true,
        updatedAt: Date.now(),
      },
    });

    const success = simulateDayClosingForTesting();
    expect(success).toBe(true);

    const state = loadStreakState();
    expect(state.count).toBe(1);
    expect(state.lastConsolidatedDate).toBe(getYesterdayDateString());
  });

  it("should trigger celebration when completing all tasks today and record lastCelebratedDate", () => {
    const todayStr = getTodayDateString();
    let eventDispatched = false;
    let dispatchedStreak = 0;

    const originalDispatch = (globalThis as unknown as { window: { dispatchEvent: (e: CustomEvent) => boolean } }).window.dispatchEvent;
    (globalThis as unknown as { window: { dispatchEvent: (e: CustomEvent) => boolean } }).window.dispatchEvent = (e: CustomEvent) => {
      if (e.type === "prumo:streak-celebration") {
        eventDispatched = true;
        dispatchedStreak = e.detail?.streakCount;
      }
      return true;
    };

    // Completa 3 tarefas de hoje
    const triggered = checkAndTriggerTodayCompletion(true, 3);
    expect(triggered).toBe(true);
    expect(eventDispatched).toBe(true);
    expect(dispatchedStreak).toBe(1);

    const state = loadStreakState();
    expect(state.count).toBe(1);
    expect(state.lastConsolidatedDate).toBe(todayStr);
    expect(state.lastCelebratedDate).toBe(todayStr);
    expect(state.history).toContain(todayStr);

    // Tentativa de celebrar novamente no mesmo dia deve ser bloqueada
    eventDispatched = false;
    const triggeredAgain = checkAndTriggerTodayCompletion(true, 3);
    expect(triggeredAgain).toBe(false);
    expect(eventDispatched).toBe(false);

    (globalThis as unknown as { window: { dispatchEvent: (e: CustomEvent) => boolean } }).window.dispatchEvent = originalDispatch;
  });

  it("should correctly generate Monday-to-Sunday week streak days uniformly", () => {
    const weekDays = getWeekStreakDays(true);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0].label).toBe("Seg");
    expect(weekDays[1].label).toBe("Ter");
    expect(weekDays[2].label).toBe("Qua");
    expect(weekDays[3].label).toBe("Qui");
    expect(weekDays[4].label).toBe("Sex");
    expect(weekDays[5].label).toBe("Sáb");
    expect(weekDays[6].label).toBe("Dom");

    // Deve haver exatamente um dia marcado como hoje
    const todayDays = weekDays.filter((d) => d.isToday);
    expect(todayDays).toHaveLength(1);
    expect(todayDays[0].isCompleted).toBe(true);
  });

  it("should never count as another day when unchecking and re-checking activities on the same day", () => {
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();

    // Suponha que tínhamos concluído ontem
    const historyWithYesterday = [yesterdayStr];

    // 1. Conclui hoje: sequência deve ser 2 (ontem + hoje)
    const count1 = calculateStreakFromHistory(historyWithYesterday, true);
    expect(count1).toBe(2);

    // 2. Usuário desmarca uma tarefa hoje: hoje deixa de ser concluído
    const countAfterUncheck = calculateStreakFromHistory(historyWithYesterday, false);
    expect(countAfterUncheck).toBe(1); // Volta para a ofensiva de ontem

    // 3. Usuário marca a tarefa novamente hoje (mesmo ciclo de 24h):
    // A sequência DEVE continuar sendo 2, NUNCA 3!
    const countAfterRecheck = calculateStreakFromHistory(historyWithYesterday, true);
    expect(countAfterRecheck).toBe(2);

    // 4. Usuário adiciona 3 tarefas, desmarca, marca de novo várias vezes hoje:
    // A sequência NUNCA pode ultrapassar 2 enquanto estiver no mesmo dia!
    for (let i = 0; i < 5; i++) {
      const streak = calculateStreakFromHistory(historyWithYesterday, true);
      expect(streak).toBe(2);
    }
  });

  it("should handle full uncheck-and-recheck cycle within the same day without duplicating streak", () => {
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();

    // Estado inicial com ontem concluído (ofensiva 1)
    saveDailySnapshots({
      [yesterdayStr]: {
        date: yesterdayStr,
        totalTasks: 3,
        completedTasks: 3,
        isFullyCompleted: true,
        updatedAt: Date.now() - 86400000,
      },
    });
    saveStreakState({
      count: 1,
      lastConsolidatedDate: yesterdayStr,
      lastCelebratedDate: yesterdayStr,
      history: [yesterdayStr],
    });

    // Passo 1: Usuário conclui todas as tarefas de hoje
    const firstCheck = checkAndTriggerTodayCompletion(true, 3);
    expect(firstCheck).toBe(true);

    let state = loadStreakState();
    expect(state.count).toBe(2);
    expect(state.lastConsolidatedDate).toBe(todayStr);
    expect(state.lastCelebratedDate).toBe(todayStr);

    // Passo 2: Usuário desmarca uma tarefa hoje (tarefa 2)
    // O sistema remove hoje do histórico ativo e recalcula
    const historyAfterUncheck = state.history.filter((d) => d !== todayStr);
    const countAfterUncheck = calculateStreakFromHistory(historyAfterUncheck, false);
    saveStreakState({
      ...state,
      count: countAfterUncheck,
      lastConsolidatedDate: yesterdayStr,
      history: historyAfterUncheck,
    });

    state = loadStreakState();
    expect(state.count).toBe(1); // Volta para ontem
    expect(state.lastCelebratedDate).toBe(todayStr); // Preserva que já celebrou hoje

    // Passo 3: Usuário marca a tarefa novamente hoje (mesmo dia)
    const secondCheck = checkAndTriggerTodayCompletion(true, 3);
    // Não pode re-celebrar no mesmo dia
    expect(secondCheck).toBe(false);

    // E a contagem recalculada DEVE ser 2, JAMAIS 3
    const historyAfterRecheck = Array.from(new Set([...state.history, todayStr]));
    const countAfterRecheck = calculateStreakFromHistory(historyAfterRecheck, true);
    saveStreakState({
      ...state,
      count: countAfterRecheck,
      lastConsolidatedDate: todayStr,
      history: historyAfterRecheck,
    });

    state = loadStreakState();
    expect(state.count).toBe(2);
    expect(state.history).toContain(todayStr);
    expect(state.history).toContain(yesterdayStr);
    expect(state.history).toHaveLength(2);
  });
});
