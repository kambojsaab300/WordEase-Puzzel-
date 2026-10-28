import { LevelSpec } from '../generator/generateLevel';
import { mulberry32, randInt, shuffle } from '../generator/prng';
import { ALL_DIRS, Dir } from '../types';
import { THEMES_BY_WORLD } from './themes';

type Band = {
  upTo: number;
  size: [number, number];
  words: [number, number];
  dirs: Dir[];
  /** Share of words read backwards; the rest read forwards */
  reversed?: number;
  /** Share of filler letters taken from the theme words */
  decoy?: number;
  falseStarts?: number;
  overlap?: boolean;
};

/**
 * Difficulty ladder. Graded word searches go: easy = across and down only, medium adds
 * diagonals, hard adds backwards words in all 8 directions. Each stage here adds ONE new
 * direction and opens gently, so it is learned before it gets mixed with the rest.
 * Past level 300 the board itself gets harder: filler made of theme letters, crossing
 * words, and near-miss word starts.
 */
const BANDS: Band[] = [
  { upTo: 10, size: [6, 7], words: [4, 5], dirs: ['E', 'S'] },
  // First backwards words: RAC in the grid is CAR
  { upTo: 25, size: [6, 7], words: [4, 6], dirs: ['E', 'S', 'W'], reversed: 0.25 },
  { upTo: 45, size: [7, 8], words: [5, 7], dirs: ['E', 'S', 'W', 'SE'], reversed: 0.3 },
  { upTo: 60, size: [7, 8], words: [6, 8], dirs: ['E', 'S', 'W', 'SE', 'N'], reversed: 0.35 },
  { upTo: 120, size: [8, 9], words: [7, 9], dirs: ['E', 'S', 'W', 'SE', 'N', 'NE'], reversed: 0.4 },
  { upTo: 300, size: [8, 9], words: [8, 10], dirs: ALL_DIRS, reversed: 0.45 },
  { upTo: 500, size: [9, 10], words: [9, 11], dirs: ALL_DIRS, reversed: 0.5, decoy: 0.3 },
  { upTo: 800, size: [10, 11], words: [10, 12], dirs: ALL_DIRS, reversed: 0.55, decoy: 0.45, overlap: true },
  {
    upTo: Infinity,
    size: [10, 12],
    words: [12, 14],
    dirs: ALL_DIRS,
    reversed: 0.6,
    decoy: 0.6,
    falseStarts: 2,
    overlap: true,
  },
];

export const LEVELS_PER_WORLD = 60;
export const LANDMARK_EVERY = 15;
// A new direction opens on easier boards, a small dip before it gets mixed in
const INTRO_LEVELS = 2;

export const isLandmark = (levelId: number) => levelId % LANDMARK_EVERY === 0;

function bandFor(levelId: number): { index: number; from: number; t: number } {
  let from = 1;
  for (let index = 0; index < BANDS.length; index++) {
    const band = BANDS[index];
    if (levelId <= band.upTo) {
      const span = band.upTo === Infinity ? 300 : band.upTo - from + 1;
      return { index, from, t: Math.min(1, (levelId - from) / Math.max(1, span - 1)) };
    }
    from = band.upTo + 1;
  }
  return { index: BANDS.length - 1, from, t: 1 };
}

const addedDirs = (index: number): Dir[] =>
  index === 0 ? [] : BANDS[index].dirs.filter(d => !BANDS[index - 1].dirs.includes(d));

/** Directions that appear for the first time on this level (for the "New!" tip). */
export function newDirectionsAt(levelId: number): Dir[] {
  const { index, from } = bandFor(levelId);
  return levelId === from ? addedDirs(index) : [];
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
  const { index, from, t } = bandFor(levelId);
  const band = BANDS[index];
  const world = Math.ceil(levelId / LEVELS_PER_WORLD);
  const levelInWorld = levelId - (world - 1) * LEVELS_PER_WORLD;
  const featuredDirs = addedDirs(index);
  const intro = featuredDirs.length > 0 && levelId - from < INTRO_LEVELS;
  const delta = intro ? -1 : rhythmDelta(levelInWorld);

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
    difficulty: size + words.length + band.dirs.length + (band.decoy ? 2 : 0) + (band.overlap ? 2 : 0),
    allowOverlap: band.overlap,
    reversedShare: band.reversed,
    featuredDirs,
    decoyShare: band.decoy,
    falseStarts: band.falseStarts,
  };
}
