import { useSettings } from '../store/settings';

// Text Size setting (Normal / Large / Huge) as an index into the fontSizes tables
export type TextSizeIndex = 0 | 1 | 2;

export function textSizeIndex(scale: number): TextSizeIndex {
  if (scale >= 1.5) return 2;
  if (scale >= 1.25) return 1;
  return 0;
}

export function useTextSize(): TextSizeIndex {
  return textSizeIndex(useSettings(s => s.textScale));
}

// Flow: Huge text never uses a grid bigger than 10x10
export const HUGE_MAX_GRID = 10;

// Largest cell per text size; small phones shrink cells to fit the screen
export const MAX_CELL: Record<TextSizeIndex, number> = { 0: 56, 1: 64, 2: 72 };

// Letters take most of the cell but never exceed the flow's sp size for the setting
export function gridLetterSize(cellSize: number, idx: TextSizeIndex, table: readonly number[]): number {
  return Math.max(12, Math.min(table[idx], Math.floor(cellSize * 0.8)));
}

// High contrast: pure black on white, firmer outlines (7:1 and above)
export const HIGH_CONTRAST = {
  board: '#FFFFFF',
  letter: '#000000',
  gridLine: 'rgba(0,0,0,0.35)',
  outline: '#000000',
  selection: '#B4391F',
  capsuleOpacity: 0.8,
} as const;

// Colour-blind mode: each found-word colour also gets its own line pattern on the
// grid and its own symbol on the word chip, so colour is never the only cue.
// Dash intervals (on, off, ...); an empty array is a solid line.
export const FOUND_PATTERNS: number[][] = [[], [14, 7], [3, 7], [14, 5, 3, 5], [24, 8], [7, 7], [2, 12]];
export const FOUND_MARKS = ['●', '■', '▲', '◆', '★', '✚', '✿'];
