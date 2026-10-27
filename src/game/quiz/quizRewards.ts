// Coins for the Daily Word Quiz. A full day is worth a few levels; the streak and the chest keep it exciting.
import { mulberry32 } from '../generator/prng';
import { hashString } from '../levels/dailyLevel';

export const QUIZ_CORRECT_COINS = 20;
/** Extra per right answer from the 3rd one in a row */
export const QUIZ_COMBO_COINS = 10;
export const QUIZ_COMBO_FROM = 3;
export const QUIZ_PERFECT_COINS = 50;
/** Sunday's quiz pays double (the chest and streak gifts stay the same) */
export const BIG_DAY_MULTIPLIER = 2;

/** Coins for one answer, given how many right answers in a row it makes */
export function answerCoins(correct: boolean, combo: number, bigDay: boolean): number {
  if (!correct) return 0;
  const base = QUIZ_CORRECT_COINS + (combo >= QUIZ_COMBO_FROM ? QUIZ_COMBO_COINS : 0);
  return base * (bigDay ? BIG_DAY_MULTIPLIER : 1);
}

export function perfectCoins(bigDay: boolean): number {
  return QUIZ_PERFECT_COINS * (bigDay ? BIG_DAY_MULTIPLIER : 1);
}

// Mystery chest at the end: usually small, now and then a big one. Fixed per day, so reopening
// the app does not reroll it; a better score opens a better chest.
const CHEST_TABLE: [coins: number, weight: number][] = [
  [10, 30],
  [20, 30],
  [30, 20],
  [50, 12],
  [100, 6],
  [250, 2],
];

export function chestCoins(dateKey: string, score: number): number {
  const roll = mulberry32(hashString(`chest-${dateKey}`))();
  const total = CHEST_TABLE.reduce((sum, [, w]) => sum + w, 0);
  let left = roll * total;
  let coins = CHEST_TABLE[0][0];
  for (const [value, weight] of CHEST_TABLE) {
    coins = value;
    left -= weight;
    if (left < 0) break;
  }
  return score === 0 ? 5 : coins + score * 2;
}

// Streak gifts on days 3, 7, 14, 30 and every 30 days after that
export function streakGift(streak: number): number {
  if (streak === 3) return 50;
  if (streak === 7) return 200;
  if (streak === 14) return 400;
  if (streak >= 30 && streak % 30 === 0) return 1000;
  return 0;
}

const MILESTONES = [3, 7, 14, 30];

/** The next streak day that brings a gift */
export function nextStreakGift(streak: number): number {
  return MILESTONES.find(m => m > streak) ?? (Math.floor(streak / 30) + 1) * 30;
}
