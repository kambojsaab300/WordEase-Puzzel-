/* eslint-disable no-bitwise -- string hash */
import { generateCheckedLevel } from '../generator/checkedLevel';
import { LevelSpec } from '../generator/generateLevel';
import { mulberry32, shuffle } from '../generator/prng';
import { Dir, LevelDef } from '../types';
import { THEMES_BY_WORLD } from './themes';

export const DAILY_LEVEL_ID = 99999;

const SIZE = 8;
const WORD_COUNT = 5;
const FILL_BUDGET = 0.55;
const DIRS: Dir[] = ['E', 'S', 'SE'];

export function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const reverse = (w: string) => [...w].reverse().join('');
const clashes = (a: string, b: string) =>
  a.includes(b) || b.includes(a) || a.includes(reverse(b)) || b.includes(reverse(a));

function dailySpec(dateStr: string, salt: number): LevelSpec {
  const seed = hashString(dateStr) + salt * 104729;
  const rng = mulberry32(seed);

  const allThemes = THEMES_BY_WORLD.flat();
  const theme = allThemes[Math.floor(rng() * allThemes.length)];
  const pool = theme.words.filter(w => w.length >= 3 && w.length <= SIZE);

  const picked: string[] = [];
  let letters = 0;
  for (const w of shuffle(rng, pool)) {
    if (picked.length === WORD_COUNT) break;
    if (letters + w.length > SIZE * SIZE * FILL_BUDGET) continue;
    if (picked.some(q => clashes(q, w))) continue;
    picked.push(w);
    letters += w.length;
  }

  return {
    id: DAILY_LEVEL_ID,
    world: 0,
    theme: `Daily · ${theme.name}`,
    words: picked,
    rows: SIZE,
    cols: SIZE,
    dirs: DIRS,
    seed,
    difficulty: 3,
  };
}

/**
 * The Daily Postcard puzzle for a date (YYYY-MM-DD): the same on every phone that day.
 * Returns null only if no safe puzzle could be made (the caller falls back).
 */
export function getDailyLevel(dateStr: string): LevelDef | null {
  return generateCheckedLevel(salt => dailySpec(dateStr, salt));
}
