import { mulberry32, randInt, Rng, shuffle } from '../generator/prng';
import { Dir, DIR_VECTORS, isReversed, LevelDef } from '../types';

/**
 * Seconds a person spends on each step of hunting a word. These are first guesses;
 * real solve times from phone play (D4) will calibrate them.
 */
export type Pace = {
  /** Read the chip, then drag the word once it is found */
  perWord: number;
  /** Glance at one cell while hunting for the word's first letter */
  look: number;
  /** Look along one direction from a matching first letter */
  check: number;
  /** Each further letter that keeps matching on a wrong path (decoy filler, near-miss starts) */
  follow: number;
  /** Reading backwards (RAC = CAR) is slower than reading forwards */
  backwardsSlowdown: number;
  /** Chance of seeing the word while looking right at it */
  noticeForwards: number;
  noticeBackwards: number;
  /** Full sweeps of the grid before a player gives up and takes a hint */
  passesBeforeHint: number;
  /** Time lost deciding on and using that hint */
  hint: number;
};

export const DEFAULT_PACE: Pace = {
  perWord: 1.5,
  look: 0.06,
  check: 0.25,
  follow: 0.12,
  backwardsSlowdown: 1.6,
  noticeForwards: 0.9,
  noticeBackwards: 0.65,
  passesBeforeHint: 3,
  hint: 4,
};

// Forwards directions first, then the backwards ones in the order the ladder teaches them
const HABIT: Dir[] = ['E', 'S', 'SE', 'W', 'N', 'NE', 'SW', 'NW'];

// Letters of `word` read from (r, c) in `dir` before the first mismatch or the grid edge
function matchLength(grid: string[], word: string, r: number, c: number, dir: Dir): number {
  const [dr, dc] = DIR_VECTORS[dir];
  let n = 0;
  while (n < word.length && grid[r + dr * n]?.[c + dc * n] === word[n]) n++;
  return n;
}

export type SolveRun = { seconds: number; hints: number };

/**
 * One simulated player solving the level. Words come in random order; each one is hunted
 * by sweeping the grid from a random cell for its first letter, then checking only the
 * directions this player has been taught. It never peeks at where the words are.
 */
export function simulateSolve(
  level: LevelDef,
  dirs: readonly Dir[],
  rng: Rng,
  pace: Pace = DEFAULT_PACE,
): SolveRun {
  const { grid, cols } = level;
  const cells = level.rows * cols;
  const order = HABIT.filter(d => dirs.includes(d));
  let seconds = 0;
  let hints = 0;

  for (const { w: word } of shuffle(rng, level.words)) {
    seconds += pace.perWord;
    const start = randInt(rng, cells);
    let found = false;

    for (let step = 0; step < cells * pace.passesBeforeHint && !found; step++) {
      const cell = (start + step) % cells;
      const r = Math.floor(cell / cols);
      const c = cell % cols;
      seconds += pace.look;
      if (grid[r][c] !== word[0]) continue;

      for (const dir of order) {
        const backwards = isReversed(dir);
        const matched = matchLength(grid, word, r, c, dir);
        seconds += (pace.check + pace.follow * Math.max(0, matched - 1)) * (backwards ? pace.backwardsSlowdown : 1);
        if (matched === word.length && rng() < (backwards ? pace.noticeBackwards : pace.noticeForwards)) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      hints++;
      seconds += pace.hint;
    }
  }
  return { seconds, hints };
}

export type Estimate = {
  /** Typical solve time in seconds */
  median: number;
  /** A slow player's time: 9 of 10 runs finish faster */
  p90: number;
  /** Hints an average run needed */
  hints: number;
};

/** Plays the level `runs` times and summarises how long it takes. */
export function estimateLevel(
  level: LevelDef,
  dirs: readonly Dir[],
  runs = 200,
  pace: Pace = DEFAULT_PACE,
): Estimate {
  // Seeded by the level, so the same level always gets the same estimate
  const rng = mulberry32(level.seed + 1);
  const times: number[] = [];
  let hints = 0;
  for (let i = 0; i < runs; i++) {
    const run = simulateSolve(level, dirs, rng, pace);
    times.push(run.seconds);
    hints += run.hints;
  }
  times.sort((a, b) => a - b);
  const at = (q: number) => times[Math.min(times.length - 1, Math.floor(q * times.length))];
  return { median: at(0.5), p90: at(0.9), hints: hints / runs };
}
