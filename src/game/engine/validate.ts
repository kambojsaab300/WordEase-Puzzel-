import { Cell, PlacedWord, wordCells } from '../types';

const sameCells = (a: Cell[], b: Cell[]) =>
  a.length === b.length && a.every(([r, c], i) => r === b[i][0] && c === b[i][1]);

/**
 * Returns the placed word the selection covers (forwards or backwards), or null.
 * Matching on cells, not letters, so a lookalike elsewhere in the grid never counts.
 */
export function matchSelection(
  selection: Cell[],
  words: PlacedWord[],
  found: ReadonlySet<string>,
): PlacedWord | null {
  if (selection.length < 2) return null;
  const reversed = [...selection].reverse();
  return (
    words.find(pw => {
      if (found.has(pw.w)) return false;
      const cells = wordCells(pw);
      return sameCells(cells, selection) || sameCells(cells, reversed);
    }) ?? null
  );
}
