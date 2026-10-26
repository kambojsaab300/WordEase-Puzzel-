import { Dir, LevelDef } from '../types';
import { eachWordExactlyOnce } from './checks';
import { fillBoard } from './fill';
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
    });
    if (!result) continue;

    const grid = fillBoard(result.board, rng);
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
