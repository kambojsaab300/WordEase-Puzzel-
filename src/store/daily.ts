import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InProgress } from './progress';
import { progressStorage, SCHEMA_VERSION } from './storage';
import { useWallet } from './wallet';

// Daily puzzle progress lives in its own slot, tied to its day, so playing the
// Daily Postcard never wipes a half-finished map level (and vice versa).
export type DailyInProgress = InProgress & { dayKey: string };

export type DailyData = {
  streak: number;
  lastDay: string; // YYYY-MM-DD of the last claimed day
  freezes: number;
  freezeWeek: string; // week that last refilled the free freeze
  done: Record<string, boolean>; // date -> true
  inProgress?: DailyInProgress;
};

export type DailyResult = { coins: number; streak: number; alreadyDone: boolean };

type DailyState = DailyData & {
  completeDaily: (dateStr: string) => DailyResult;
  isDone: (dateStr: string) => boolean;
  saveInProgress: (state: DailyInProgress) => void;
  addFreeze: () => void;
  reset: () => void;
};

export const INITIAL_DAILY: DailyData = {
  streak: 0,
  lastDay: '',
  freezes: 1,
  freezeWeek: '',
  done: {},
  inProgress: undefined,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const formatKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Local calendar day of the phone
export function getTodayKey(now = new Date()): string {
  return formatKey(now);
}

export function getYesterdayKey(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return formatKey(d);
}

// Whole days since 1970-01-01 for a YYYY-MM-DD key (UTC maths, so no DST surprises)
function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function daysBetween(fromKey: string, toKey: string): number {
  return dayNumber(toKey) - dayNumber(fromKey);
}

// Weeks start on Monday (1970-01-01 was a Thursday)
export function weekKeyOf(key: string): string {
  return String(Math.floor((dayNumber(key) + 3) / 7));
}

// Rewards follow a 7-day cycle: day 3 = 100, day 7 = 300, other days = 50
export function dailyCoinsFor(streak: number): number {
  const dayOfCycle = ((streak - 1) % 7) + 1;
  if (dayOfCycle === 7) return 300;
  if (dayOfCycle === 3) return 100;
  return 50;
}

export const useDaily = create<DailyState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DAILY,
      isDone: dateStr => Boolean(get().done[dateStr]),
      completeDaily: dateStr => {
        const state = get();
        if (state.done[dateStr]) {
          return { coins: 0, streak: state.streak, alreadyDone: true };
        }
        // Phone clock moved back to before the last claim: no reward, no streak change
        if (state.lastDay && daysBetween(state.lastDay, dateStr) < 0) {
          return { coins: 0, streak: state.streak, alreadyDone: true };
        }

        // One free freeze per week (they do not pile up)
        const week = weekKeyOf(dateStr);
        let freezes = state.freezes;
        if (week !== state.freezeWeek) freezes = Math.max(freezes, 1);

        const gap = state.lastDay ? daysBetween(state.lastDay, dateStr) : 0;
        let streak = 1;
        if (gap === 1) {
          streak = state.streak + 1;
        } else if (gap === 2 && freezes > 0 && state.streak > 0) {
          // Exactly one missed day: the freeze keeps the streak alive
          freezes -= 1;
          streak = state.streak + 1;
        }

        const coins = dailyCoinsFor(streak);
        set({
          streak,
          lastDay: dateStr,
          freezes,
          freezeWeek: week,
          done: { ...state.done, [dateStr]: true },
          inProgress: undefined,
        });
        useWallet.getState().add(coins);
        return { coins, streak, alreadyDone: false };
      },
      saveInProgress: inProgress => set({ inProgress }),
      addFreeze: () => set(s => ({ freezes: s.freezes + 1 })),
      reset: () => set({ ...INITIAL_DAILY }),
    }),
    {
      name: 'daily',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: ({ streak, lastDay, freezes, freezeWeek, done, inProgress }) => ({
        streak,
        lastDay,
        freezes,
        freezeWeek,
        done,
        inProgress,
      }),
      migrate: saved => ({ ...INITIAL_DAILY, ...(saved as Partial<DailyData>) }),
    },
  ),
);
