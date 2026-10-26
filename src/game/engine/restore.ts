import type { LevelDef } from '../types';
import type { HintKind, HintMark } from './hints';

export type LevelState = {
  found: string[];
  bonusFound: string[];
  hints: HintMark[];
};

const HINT_KINDS: HintKind[] = ['spotlight', 'compass', 'reveal'];
const unique = <T,>(items: T[]) => [...new Set(items)];

/**
 * Cleans a saved level state against the level actually being played.
 * A save from another puzzle (e.g. yesterday's Daily) or a damaged file
 * must never put unknown words on the grid.
 */
export function sanitizeSaved(level: LevelDef, saved: Partial<LevelState> | null | undefined): LevelState {
  const words = new Set(level.words.map(w => w.w));
  const bonus = new Set(level.bonus);
  const asArray = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

  return {
    found: unique(asArray<string>(saved?.found).filter(w => words.has(w))),
    bonusFound: unique(asArray<string>(saved?.bonusFound).filter(w => bonus.has(w))),
    hints: asArray<HintMark>(saved?.hints).filter(
      h => h && words.has(h.word) && HINT_KINDS.includes(h.kind),
    ),
  };
}
