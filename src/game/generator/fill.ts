import type { Board } from './placeWords';
import { Rng } from './prng';

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

// Fills empty cells and returns the grid as one string per row
export function fillBoard(board: Board, rng: Rng): string[] {
  return board.map(row => row.map(cell => cell ?? randomLetter(rng)).join(''));
}
