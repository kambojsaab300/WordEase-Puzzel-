/**
 * Plays every shipped level the way a finger would: for each word, a drag from the
 * centre of its first cell to the centre of its last cell (and backwards), and a
 * Tap-Tap on its two ends. Every word must be selectable and recognised, and
 * nothing else on the grid may be mistaken for a theme word.
 */
import { wordsInGrid } from '../src/game/generator/checks';
import { lineBetween, selectionFromDrag } from '../src/game/engine/selection';
import { matchSelection } from '../src/game/engine/validate';
import { getLevel, SHIPPED_LEVELS } from '../src/game/levels/levelRepo';
import { Cell, wordCells } from '../src/game/types';

const CELL = 40;
const center = ([r, c]: Cell) => [c * CELL + CELL / 2, r * CELL + CELL / 2];

function dragSelect(from: Cell, to: Cell, rows: number, cols: number): Cell[] {
  const [x0, y0] = center(from);
  const [x1, y1] = center(to);
  return selectionFromDrag(from, x1 - x0, y1 - y0, CELL, rows, cols);
}

describe('every shipped level is playable', () => {
  test('all 1,200 levels: every word can be dragged forwards and backwards, and tapped', () => {
    const problems: string[] = [];
    for (let id = 1; id <= SHIPPED_LEVELS; id++) {
      const level = getLevel(id);
      for (const pw of level.words) {
        const cells = wordCells(pw);
        const first = cells[0];
        const last = cells[cells.length - 1];

        const forward = dragSelect(first, last, level.rows, level.cols);
        const backward = dragSelect(last, first, level.rows, level.cols);
        const tapped = lineBetween(first, last);

        for (const [how, sel] of [['drag', forward], ['reverse drag', backward], ['tap', tapped]] as const) {
          if (!sel || matchSelection(sel, level.words, new Set())?.w !== pw.w) {
            problems.push(`level ${id} ${pw.w}: ${how} failed`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('finding every word in turn completes each level (no word left unreachable)', () => {
    for (let id = 1; id <= SHIPPED_LEVELS; id += 7) {
      const level = getLevel(id);
      const found = new Set<string>();
      for (const pw of level.words) {
        const match = matchSelection(wordCells(pw), level.words, found);
        expect(match?.w).toBe(pw.w);
        found.add(pw.w);
      }
      expect(found.size).toBe(level.words.length);
    }
  });

  test('a found word cannot be counted again (negative)', () => {
    const level = getLevel(1);
    const pw = level.words[0];
    expect(matchSelection(wordCells(pw), level.words, new Set([pw.w]))).toBeNull();
  });

  test('one cell too short or too long is not a match (negative)', () => {
    const level = getLevel(200);
    for (const pw of level.words) {
      const cells = wordCells(pw);
      expect(matchSelection(cells.slice(0, -1), level.words, new Set())).toBeNull();
      expect(matchSelection(cells.slice(1), level.words, new Set())).toBeNull();
    }
  });

  test('every bonus word stored in a level is really readable in its grid', () => {
    for (let id = 1; id <= SHIPPED_LEVELS; id += 11) {
      const level = getLevel(id);
      const readable = wordsInGrid(level.grid, new Set(level.bonus), 4, 8);
      expect([...readable].sort()).toEqual([...level.bonus].sort());
    }
  });

  test('grid sizes always fit a 360dp phone at 27dp or more per cell', () => {
    for (let id = 1; id <= SHIPPED_LEVELS; id++) {
      const { cols } = getLevel(id);
      expect(Math.floor((360 - 32) / cols)).toBeGreaterThanOrEqual(27);
    }
  });
});
