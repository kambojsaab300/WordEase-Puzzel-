/**
 * Live tuning results (D6): level id → how much to scale that level's target time.
 * Written by tools/live-tune.ts, read by generate-levels and validate-levels. A missing
 * file or level means 1 (no change).
 */
import fs from 'node:fs';
import path from 'node:path';
import { targetSeconds } from '../src/game/difficulty/target';

export const TUNING_FILE = path.resolve(__dirname, 'level-tuning.json');

export type Tuning = Record<string, number>;

export function loadTuning(): Tuning {
  if (!fs.existsSync(TUNING_FILE)) return {};
  return JSON.parse(fs.readFileSync(TUNING_FILE, 'utf8')) as Tuning;
}

export function saveTuning(tuning: Tuning): void {
  const sorted = Object.fromEntries(Object.entries(tuning).sort(([a], [b]) => Number(a) - Number(b)));
  fs.writeFileSync(TUNING_FILE, JSON.stringify(sorted, null, 2) + '\n');
}

/** The target after live tuning: what the level tool aims for and the validator checks. */
export const tunedTarget = (tuning: Tuning, levelId: number) => targetSeconds(levelId) * (tuning[levelId] ?? 1);
