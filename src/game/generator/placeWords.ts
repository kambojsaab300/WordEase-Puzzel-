import { Cell, Dir, DIR_VECTORS, isReversed, PlacedWord } from '../types';
import { Rng, shuffle } from './prng';

export type Board = (string | null)[][];

type Options = {
  rows: number;
  cols: number;
  dirs: Dir[];
  allowOverlap?: boolean;
  maxTries?: number;
  /** About this share of the words runs backwards (see isReversed), the rest forwards */
  reversedShare?: number;
  /** Directions the level is teaching: at least one word uses them */
  featuredDirs?: Dir[];
};

export function reversedQuota(wordCount: number, share = 0): number {
  return share > 0 ? Math.min(wordCount, Math.max(1, Math.round(wordCount * share))) : 0;
}

/**
 * Gives each word the directions it may use. With all 8 open, 5 of them read backwards,
 * so a free choice would make most words backwards from the first hard level on and the
 * curve would go flat. A set share per stage lets it climb slowly instead.
 */
function directionPlan(
  words: string[],
  rng: Rng,
  { dirs, reversedShare, featuredDirs = [] }: Options,
): Map<string, Dir[]> {
  const plan = new Map<string, Dir[]>();
  if (!reversedShare && featuredDirs.length === 0) return plan; // keeps old seeds stable

  const order = shuffle(rng, words);
  let reversed = 0;
  if (featuredDirs.length > 0 && order.length > 0) {
    plan.set(order[0], featuredDirs);
    if (featuredDirs.every(isReversed)) reversed++;
  }
  const backwards = dirs.filter(isReversed);
  const forwards = dirs.filter(d => !isReversed(d));
  const quota = reversedQuota(words.length, reversedShare);
  for (const w of order) {
    if (plan.has(w)) continue;
    const goesBack = reversed < quota && backwards.length > 0;
    plan.set(w, goesBack ? backwards : forwards);
    if (goesBack) reversed++;
  }
  return plan;
}

type Candidate = { start: Cell; dir: Dir };

function candidatesFor(word: string, rows: number, cols: number, dirs: Dir[]): Candidate[] {
  const out: Candidate[] = [];
  const last = word.length - 1;
  for (const dir of dirs) {
    const [dr, dc] = DIR_VECTORS[dir];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const endR = r + dr * last;
        const endC = c + dc * last;
        if (endR >= 0 && endR < rows && endC >= 0 && endC < cols) {
          out.push({ start: [r, c], dir });
        }
      }
    }
  }
  return out;
}

function fits(board: Board, word: string, { start, dir }: Candidate, allowOverlap: boolean) {
  const [dr, dc] = DIR_VECTORS[dir];
  for (let i = 0; i < word.length; i++) {
    const existing = board[start[0] + dr * i][start[1] + dc * i];
    if (existing === null) continue;
    if (!allowOverlap || existing !== word[i]) return false;
  }
  return true;
}

// Writes the word and returns the cells it newly filled, so they can be undone
function write(board: Board, word: string, { start, dir }: Candidate): Cell[] {
  const [dr, dc] = DIR_VECTORS[dir];
  const written: Cell[] = [];
  for (let i = 0; i < word.length; i++) {
    const r = start[0] + dr * i;
    const c = start[1] + dc * i;
    if (board[r][c] === null) {
      board[r][c] = word[i];
      written.push([r, c]);
    }
  }
  return written;
}

/**
 * Places words longest-first with backtracking.
 * Returns null after maxTries so the caller can restart with a new seed.
 */
export function placeWords(
  words: string[],
  rng: Rng,
  options: Options,
): { board: Board; placed: PlacedWord[] } | null {
  const { rows, cols, dirs, allowOverlap = false, maxTries = 200 } = options;
  const board: Board = Array.from({ length: rows }, () => Array(cols).fill(null));
  const plan = directionPlan(words, rng, options);
  const ordered = [...words].sort((a, b) => b.length - a.length);
  const placed: PlacedWord[] = [];
  let tries = 0;

  const placeFrom = (index: number): boolean => {
    if (index === ordered.length) return true;
    const word = ordered[index];
    for (const cand of shuffle(rng, candidatesFor(word, rows, cols, plan.get(word) ?? dirs))) {
      if (!fits(board, word, cand, allowOverlap)) continue;
      if (++tries > maxTries) return false;

      const written = write(board, word, cand);
      placed.push({ w: word, start: cand.start, dir: cand.dir });
      if (placeFrom(index + 1)) return true;

      placed.pop();
      for (const [r, c] of written) board[r][c] = null;
      if (tries > maxTries) return false;
    }
    return false;
  };

  return placeFrom(0) ? { board, placed } : null;
}
