import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUIZ_LENGTH } from '../game/quiz/dailyQuiz';
import { answerCoins, chestCoins, perfectCoins, streakGift } from '../game/quiz/quizRewards';
import { daysBetween, weekKeyOf } from './daily';
import { progressStorage, SCHEMA_VERSION } from './storage';
import { useWallet } from './wallet';

// Today's quiz is saved answer by answer, so closing the app never rerolls a question
export type QuizDay = {
  dayKey: string;
  results: boolean[];
  combo: number; // right answers in a row
  coins: number; // everything the quiz paid today
  used5050: boolean;
  finished: boolean;
  perfectBonus: number;
  streakGift: number;
  streakSaved: boolean; // a missed day was covered by the weekly save
  chest: number;
  chestOpened: boolean;
};

type QuizData = {
  streak: number;
  best: number;
  lastDay: string; // last finished quiz
  saveWeek: string; // week that used its one free streak save
  today?: QuizDay;
};

export type AnswerResult = { coins: number; combo: number };

type QuizState = QuizData & {
  /** Today's saved state, or a fresh one */
  dayOf: (dayKey: string) => QuizDay;
  /** Records the answer to question `index`; null when it was already answered */
  answer: (dayKey: string, index: number, correct: boolean, bigDay: boolean) => AnswerResult | null;
  use5050: (dayKey: string) => void;
  finish: (dayKey: string, bigDay: boolean) => QuizDay;
  openChest: (dayKey: string) => number;
  reset: () => void;
};

/** Streak to show before today's quiz; atRisk = it ends unless today's quiz is played */
export function streakStatus(
  streak: number,
  lastDay: string,
  saveWeek: string,
  todayKey: string,
): { shown: number; atRisk: boolean } {
  if (!lastDay || streak === 0) return { shown: 0, atRisk: false };
  const gap = daysBetween(lastDay, todayKey);
  if (gap <= 1) return { shown: streak, atRisk: gap === 1 };
  if (gap === 2 && saveWeek !== weekKeyOf(todayKey)) return { shown: streak, atRisk: true };
  return { shown: 0, atRisk: false };
}

const INITIAL: QuizData = { streak: 0, best: 0, lastDay: '', saveWeek: '', today: undefined };

const freshDay = (dayKey: string): QuizDay => ({
  dayKey,
  results: [],
  combo: 0,
  coins: 0,
  used5050: false,
  finished: false,
  perfectBonus: 0,
  streakGift: 0,
  streakSaved: false,
  chest: 0,
  chestOpened: false,
});

export const useQuiz = create<QuizState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      dayOf: dayKey => {
        const today = get().today;
        return today?.dayKey === dayKey ? today : freshDay(dayKey);
      },
      answer: (dayKey, index, correct, bigDay) => {
        const day = get().dayOf(dayKey);
        if (day.finished || index !== day.results.length || index >= QUIZ_LENGTH) return null;
        const combo = correct ? day.combo + 1 : 0;
        const coins = answerCoins(correct, combo, bigDay);
        set({ today: { ...day, results: [...day.results, correct], combo, coins: day.coins + coins } });
        if (coins > 0) useWallet.getState().add(coins);
        return { coins, combo };
      },
      use5050: dayKey => set({ today: { ...get().dayOf(dayKey), used5050: true } }),
      finish: (dayKey, bigDay) => {
        const state = get();
        const day = state.dayOf(dayKey);
        if (day.finished || day.results.length < QUIZ_LENGTH) return day;

        const score = day.results.filter(Boolean).length;
        const gap = state.lastDay ? daysBetween(state.lastDay, dayKey) : 1;
        const week = weekKeyOf(dayKey);
        let { streak, saveWeek } = state;
        let streakSaved = false;
        if (gap < 0) {
          // Phone clock moved back: the streak stays as it was
        } else if (gap === 1) {
          streak += 1;
        } else if (gap === 2 && saveWeek !== week && streak > 0) {
          // One missed day a week is forgiven, so one busy day never wipes a long streak
          streak += 1;
          saveWeek = week;
          streakSaved = true;
        } else {
          streak = 1;
        }

        const gift = gap < 0 ? 0 : streakGift(streak);
        const perfectBonus = score === QUIZ_LENGTH ? perfectCoins(bigDay) : 0;
        const done: QuizDay = {
          ...day,
          finished: true,
          perfectBonus,
          streakGift: gift,
          streakSaved,
          chest: chestCoins(dayKey, score),
          coins: day.coins + perfectBonus + gift,
        };
        set({
          today: done,
          streak,
          best: Math.max(state.best, streak),
          lastDay: gap < 0 ? state.lastDay : dayKey,
          saveWeek,
        });
        if (perfectBonus + gift > 0) useWallet.getState().add(perfectBonus + gift);
        return done;
      },
      openChest: dayKey => {
        const day = get().dayOf(dayKey);
        if (!day.finished || day.chestOpened) return 0;
        set({ today: { ...day, chestOpened: true, coins: day.coins + day.chest } });
        useWallet.getState().add(day.chest);
        return day.chest;
      },
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'quiz',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: ({ streak, best, lastDay, saveWeek, today }) => ({ streak, best, lastDay, saveWeek, today }),
      migrate: saved => ({ ...INITIAL, ...(saved as Partial<QuizData>) }),
    },
  ),
);
