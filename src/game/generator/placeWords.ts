import { Cell, Dir, DIR_VECTORS, PlacedWord } from '../types';
import { Rng, shuffle } from './prng';

export type Board = (string | null)[][];

type Options = {
  rows: number;
  cols: number;
  dirs: Dir[];
  allowOverlap?: boolean;
  maxTries?: number;
};

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
  { rows, cols, dirs, allowOverlap = false, maxTries = 200 }: Options,
): { board: Board; placed: PlacedWord[] } | null {
  const board: Board = Array.from({ length: rows }, () => Array(cols).fill(null));
  const ordered = [...words].sort((a, b) => b.length - a.length);
  const placed: PlacedWord[] = [];
  let tries = 0;

  const placeFrom = (index: number): boolean => {
    if (index === ordered.length) return true;
    const word = ordered[index];
    for (const cand of shuffle(rng, candidatesFor(word, rows, cols, dirs))) {
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
