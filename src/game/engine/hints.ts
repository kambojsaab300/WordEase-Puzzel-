import { PlacedWord } from '../types';

export type HintKind = 'spotlight' | 'compass' | 'reveal';

/** `free`: the stuck-player nudge (engine/nudge.ts), which costs no coins and no star */
export type HintMark = { word: string; kind: HintKind; free?: boolean };

export const HINT_COST: Record<HintKind, number> = {
  spotlight: 25,
  compass: 40,
  reveal: 60,
};

// Hint goes to the first word (chip order) that is not found and not already revealed
export function pickHintWord(
  words: PlacedWord[],
  found: ReadonlySet<string>,
  marks: HintMark[],
): PlacedWord | null {
  const revealed = new Set(marks.filter(m => m.kind === 'reveal').map(m => m.word));
  return words.find(pw => !found.has(pw.w) && !revealed.has(pw.w)) ?? null;
}

// A stronger hint on the same word replaces the weaker mark
export function strongestMark(marks: HintMark[], word: string): HintKind | null {
  const order: HintKind[] = ['reveal', 'compass', 'spotlight'];
  return order.find(kind => marks.some(m => m.word === word && m.kind === kind)) ?? null;
}
