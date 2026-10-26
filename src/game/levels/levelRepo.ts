import { getTodayKey } from '../../store/daily';
import { generateCheckedLevel } from '../generator/checkedLevel';
import type { LevelDef } from '../types';
import { DAILY_LEVEL_ID, getDailyLevel } from './dailyLevel';
import { LEVELS_PER_WORLD, levelSpec } from './levelSpec';
import { PACKS } from './packs';
import { WORLD_COUNT } from './worlds';

export { DAILY_LEVEL_ID };
export const SHIPPED_LEVELS = WORLD_COUNT * LEVELS_PER_WORLD;

function shippedLevel(levelId: number): LevelDef {
  const world = Math.ceil(levelId / LEVELS_PER_WORLD);
  return PACKS[world]()[levelId - (world - 1) * LEVELS_PER_WORLD - 1];
}

// If a phone-made puzzle cannot pass its checks, play a shipped one rather than crash
function fallbackLevel(id: number, seed: number): LevelDef {
  const shipped = shippedLevel((seed % SHIPPED_LEVELS) + 1);
  return { ...shipped, id };
}

/**
 * Shipped levels come from the JSON packs. Past the last pack the game keeps going
 * with puzzles generated on the spot ("Classic Play"), so it never runs out.
 */
export function getLevel(levelId: number): LevelDef {
  if (levelId === DAILY_LEVEL_ID) {
    const day = getTodayKey();
    return getDailyLevel(day) ?? fallbackLevel(DAILY_LEVEL_ID, Number(day.replace(/-/g, '')));
  }
  // Anything odd (0, negative, NaN, 2.5) becomes a valid level number
  const id = Number.isFinite(levelId) ? Math.max(1, Math.floor(levelId)) : 1;
  if (id <= SHIPPED_LEVELS) return shippedLevel(id);
  return generateCheckedLevel(salt => levelSpec(id, salt)) ?? fallbackLevel(id, id);
}

let meanings: Record<string, string> | null = null;

export function meaningOf(word: string): string | undefined {
  meanings ??= require('../../../assets/meanings/en.json') as Record<string, string>;
  return meanings[word];
}
