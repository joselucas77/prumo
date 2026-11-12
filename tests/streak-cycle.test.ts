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
});
