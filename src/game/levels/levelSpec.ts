import { LevelSpec } from '../generator/generateLevel';
import { mulberry32, randInt, shuffle } from '../generator/prng';
import { ALL_DIRS, Dir } from '../types';
import { THEMES_BY_WORLD } from './themes';

type Band = {
  upTo: number;
  size: [number, number];
  words: [number, number];
  dirs: Dir[];
  overlap?: boolean;
};

// Difficulty table from the design flow
const BANDS: Band[] = [
  { upTo: 30, size: [6, 7], words: [4, 6], dirs: ['E', 'S'] },
  { upTo: 120, size: [7, 8], words: [6, 8], dirs: ['E', 'S', 'SE'] },
  { upTo: 300, size: [8, 9], words: [8, 10], dirs: ['E', 'S', 'SE', 'W', 'N'] },
  { upTo: 700, size: [9, 10], words: [10, 12], dirs: ALL_DIRS },
  { upTo: Infinity, size: [10, 12], words: [12, 14], dirs: ALL_DIRS, overlap: true },
];

export const LEVELS_PER_WORLD = 60;
export const LANDMARK_EVERY = 15;

export const isLandmark = (levelId: number) => levelId % LANDMARK_EVERY === 0;

function bandFor(levelId: number): { band: Band; t: number } {
  let from = 1;
  for (const band of BANDS) {
    if (levelId <= band.upTo) {
      const span = band.upTo === Infinity ? 300 : band.upTo - from + 1;
      return { band, t: Math.min(1, (levelId - from) / Math.max(1, span - 1)) };
    }
    from = band.upTo + 1;
  }
  return { band: BANDS[BANDS.length - 1], t: 1 };
}

/**
 * Sawtooth rhythm inside a world: warm-up, slow climb, landmark peaks,
 * a breather after the first landmark, and the hardest stretch before the finale.
 */
export function rhythmDelta(levelInWorld: number): -1 | 0 | 1 {
  if (levelInWorld <= 5) return -1;
  if (levelInWorld === 16 || levelInWorld === 17) return -1;
  if (levelInWorld % LANDMARK_EVERY === 0) return 1;
  if (levelInWorld >= 46) return 1;
  return 0;
}

const clamp = (x: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, x));
const lerp = ([lo, hi]: [number, number], t: number) => Math.round(lo + (hi - lo) * t);
const reverse = (w: string) => [...w].reverse().join('');

// A word hidden inside another (TREE in STREET) would appear twice in the grid
const clashes = (a: string, b: string) =>
  a.includes(b) || b.includes(a) || a.includes(reverse(b)) || b.includes(reverse(a));

// Share of grid cells theme words may use; denser grids rarely fit without overlap
const FILL_BUDGET = 0.6;
const OVERLAP_FILL_BUDGET = 0.75;

function pickWords(shuffled: string[], count: number, letterBudget: number): string[] {
  const picked: string[] = [];
  let letters = 0;
  for (const w of shuffled) {
    if (picked.length === count) break;
    if (letters + w.length > letterBudget) continue;
    if (picked.some(q => clashes(q, w))) continue;
    picked.push(w);
    letters += w.length;
  }
  return picked;
}

/** `salt` lets the level tool ask for a different puzzle when a check fails. */
export function levelSpec(levelId: number, salt = 0): LevelSpec {
  const { band, t } = bandFor(levelId);
  const world = Math.ceil(levelId / LEVELS_PER_WORLD);
  const levelInWorld = levelId - (world - 1) * LEVELS_PER_WORLD;
  const delta = rhythmDelta(levelInWorld);

  const size = clamp(lerp(band.size, t) + (delta > 0 ? 1 : 0), band.size);
  const seed = levelId * 1000003 + salt * 104729;
  const rng = mulberry32(seed);

  const worldThemes = THEMES_BY_WORLD[(world - 1) % THEMES_BY_WORLD.length];
  const theme = worldThemes[(levelInWorld - 1) % worldThemes.length];
  const pool = theme.words.filter(w => w.length <= size);
  const target = clamp(lerp(band.words, t) + delta + randInt(rng, 2), band.words);
  const budget = size * size * (band.overlap ? OVERLAP_FILL_BUDGET : FILL_BUDGET);
  const words = pickWords(shuffle(rng, pool), target, budget);

  return {
    id: levelId,
    world,
    theme: theme.name,
    words,
    rows: size,
    cols: size,
    dirs: band.dirs,
    seed,
    difficulty: size + words.length + band.dirs.length + (band.overlap ? 2 : 0),
    allowOverlap: band.overlap,
  };
}
