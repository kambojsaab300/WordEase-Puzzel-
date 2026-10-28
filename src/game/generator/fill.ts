import { Dir, DIR_VECTORS } from '../types';
import type { Board } from './placeWords';
import { randInt, Rng } from './prng';

// Approximate English letter frequency (percent)
const EN_FREQUENCY: Record<string, number> = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3,
  L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5,
  V: 1.0, K: 0.8, J: 0.2, X: 0.2, Q: 0.1, Z: 0.1,
};

const LETTERS = Object.keys(EN_FREQUENCY);
const CUMULATIVE = (() => {
  const total = LETTERS.reduce((sum, l) => sum + EN_FREQUENCY[l], 0);
  let running = 0;
  return LETTERS.map(l => (running += EN_FREQUENCY[l] / total));
})();

export function randomLetter(rng: Rng): string {
  const x = rng();
  const i = CUMULATIVE.findIndex(edge => x < edge);
  return LETTERS[i === -1 ? LETTERS.length - 1 : i];
}

/** `share` of the filler comes from `letters` (the theme words) instead of plain English. */
export type DecoyFill = { letters: string; share: number };

/**
 * Fills empty cells and returns the grid as one string per row.
 * With a decoy, the filler looks like the theme words, so every glance finds a false lead.
 */
export function fillBoard(board: Board, rng: Rng, decoy?: DecoyFill): string[] {
  const filler = () =>
    decoy && rng() < decoy.share ? decoy.letters[randInt(rng, decoy.letters.length)] : randomLetter(rng);
  return board.map(row => row.map(cell => cell ?? filler()).join(''));
}

const SPOT_TRIES = 30;

/**
 * Near-miss trick from hard printed word searches: writes the start of a theme word
 * (TIG for TIGER) on empty cells. It catches the eye but stops two letters short.
 */
export function plantFalseStarts(board: Board, words: string[], count: number, dirs: Dir[], rng: Rng): void {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const long = words.filter(w => w.length >= 5);
  if (long.length === 0) return;

  for (let n = 0; n < count; n++) {
    const stub = long[randInt(rng, long.length)].slice(0, -2);
    for (let attempt = 0; attempt < SPOT_TRIES; attempt++) {
      const [dr, dc] = DIR_VECTORS[dirs[randInt(rng, dirs.length)]];
      const r = randInt(rng, rows);
      const c = randInt(rng, cols);
      const cells = Array.from(stub, (_, i) => [r + dr * i, c + dc * i]);
      const free = cells.every(([rr, cc]) => rr >= 0 && rr < rows && cc >= 0 && cc < cols && board[rr][cc] === null);
      if (!free) continue;
      cells.forEach(([rr, cc], i) => (board[rr][cc] = stub[i]));
      break;
    }
  }
}
