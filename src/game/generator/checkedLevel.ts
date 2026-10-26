import type { LevelDef } from '../types';
import { blocklistHits, diagonalShare, MIN_DIAGONAL_SHARE } from './checks';
import { generateLevel, LevelSpec } from './generateLevel';

// Same list the level tool uses (written by tools/generate-levels.ts)
const BLOCKLIST: ReadonlySet<string> = new Set(require('./blocklist.en.json') as string[]);
const DIAGONAL_DIRS = ['SE', 'NW', 'NE', 'SW'];
const MAX_SALT = 60;

/**
 * For puzzles made on the phone (Daily Postcard, Classic Play): same safety checks as the
 * shipped packs. Tries new seeds until one passes; returns null if none does, so the
 * caller can fall back instead of crashing.
 */
export function generateCheckedLevel(specFor: (salt: number) => LevelSpec): LevelDef | null {
  for (let salt = 0; salt < MAX_SALT; salt++) {
    const spec = specFor(salt);
    let level: LevelDef;
    try {
      level = generateLevel(spec);
    } catch {
      continue;
    }
    if (blocklistHits(level, BLOCKLIST).length > 0) continue;
    const allowsDiagonal = spec.dirs.some(d => DIAGONAL_DIRS.includes(d));
    if (allowsDiagonal && diagonalShare(level) < MIN_DIAGONAL_SHARE) continue;
    return level;
  }
  return null;
}
