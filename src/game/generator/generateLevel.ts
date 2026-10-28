import { Dir, LevelDef } from '../types';
import { eachWordExactlyOnce } from './checks';
import { fillBoard, plantFalseStarts } from './fill';
import { placeWords } from './placeWords';
import { mulberry32 } from './prng';

export type LevelSpec = {
  id: number;
  world: number;
  theme: string;
  words: string[];
  rows: number;
  cols: number;
  dirs: Dir[];
  seed: number;
  difficulty: number;
  allowOverlap?: boolean;
  /** Share of words read backwards (RAC = CAR); the rest read forwards */
  reversedShare?: number;
  /** Newly taught directions: at least one word uses them */
  featuredDirs?: Dir[];
  /** Share of filler letters taken from the theme words */
  decoyShare?: number;
  /** How many near-miss word starts to hide in the filler */
  falseStarts?: number;
};

const MAX_RESTARTS = 50;

export function generateLevel(spec: LevelSpec): LevelDef {
  for (let attempt = 0; attempt < MAX_RESTARTS; attempt++) {
    const rng = mulberry32(spec.seed + attempt * 7919);
    const result = placeWords(spec.words, rng, {
      rows: spec.rows,
      cols: spec.cols,
      dirs: spec.dirs,
      allowOverlap: spec.allowOverlap,
      reversedShare: spec.reversedShare,
      featuredDirs: spec.featuredDirs,
    });
    if (!result) continue;

    if (spec.falseStarts) plantFalseStarts(result.board, spec.words, spec.falseStarts, spec.dirs, rng);
    const decoy = spec.decoyShare ? { letters: spec.words.join(''), share: spec.decoyShare } : undefined;
    const grid = fillBoard(result.board, rng, decoy);
    // Random fill can create a second copy of a theme word; try again if so
    if (!eachWordExactlyOnce(grid, spec.words)) continue;

    return {
      id: spec.id,
      world: spec.world,
      theme: spec.theme,
      rows: spec.rows,
      cols: spec.cols,
      grid,
      words: result.placed,
      bonus: [],
      seed: spec.seed,
      difficulty: spec.difficulty,
    };
  }
  throw new Error(`Could not generate level ${spec.id}`);
}
