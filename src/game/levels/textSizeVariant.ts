import { generateCheckedLevel } from '../generator/checkedLevel';
import { ALL_DIRS, LevelDef } from '../types';

const OVERLAP_BUDGET = 0.75;
const MIN_WORDS = 3; // fewer would not be a real puzzle; keep the original then

/**
 * Huge text keeps grids at `maxGrid` x `maxGrid` (flow rule). A bigger level is
 * re-made on the smaller board with as many of its own theme words as fit, so
 * meanings, stars and progress still belong to the same level.
 */
export function fitGridSize(level: LevelDef, maxGrid: number): LevelDef {
  if (level.rows <= maxGrid && level.cols <= maxGrid) return level;

  const budget = maxGrid * maxGrid * OVERLAP_BUDGET;
  const words: string[] = [];
  let letters = 0;
  for (const { w } of level.words) {
    if (w.length > maxGrid || letters + w.length > budget) continue;
    words.push(w);
    letters += w.length;
  }

  if (words.length < MIN_WORDS) return level;

  const smaller = generateCheckedLevel(salt => ({
    id: level.id,
    world: level.world,
    theme: level.theme,
    words,
    rows: maxGrid,
    cols: maxGrid,
    dirs: ALL_DIRS,
    seed: level.seed + 7 + salt * 104729,
    difficulty: level.difficulty,
    allowOverlap: true,
  }));
  return smaller ?? level;
}
