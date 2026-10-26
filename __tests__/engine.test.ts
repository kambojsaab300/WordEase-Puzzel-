import { coinsFor, starsFor } from '../src/game/engine/scoring';
import {
  lineBetween,
  pointToCell,
  selectionFromDrag,
  snapDirection,
} from '../src/game/engine/selection';
import { matchSelection } from '../src/game/engine/validate';
import { Cell, PlacedWord } from '../src/game/types';

const CELL = 50;

describe('snapDirection', () => {
  test.each([
    [10, 0, 'E'],
    [10, 10, 'SE'],
    [0, 10, 'S'],
    [-10, 10, 'SW'],
    [-10, 0, 'W'],
    [-10, -10, 'NW'],
    [0, -10, 'N'],
    [10, -10, 'NE'],
  ])('dx=%i dy=%i -> %s', (dx, dy, dir) => {
    expect(snapDirection(dx, dy)).toBe(dir);
  });

  test('snaps within 22.5 degrees', () => {
    // 20 degrees below horizontal is still east
    expect(snapDirection(Math.cos(0.349), Math.sin(0.349))).toBe('E');
    // 25 degrees snaps to the diagonal
    expect(snapDirection(Math.cos(0.436), Math.sin(0.436))).toBe('SE');
  });
});

describe('selectionFromDrag', () => {
  test('tiny movement selects only the start cell', () => {
    expect(selectionFromDrag([2, 2], 5, 5, CELL, 8, 8)).toEqual([[2, 2]]);
  });

  test('straight drag right covers the right cells', () => {
    expect(selectionFromDrag([0, 0], 3 * CELL, 4, CELL, 8, 8)).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });

  test('half-way drag rounds to the nearest cell', () => {
    expect(selectionFromDrag([0, 0], 1.4 * CELL, 0, CELL, 8, 8)).toHaveLength(2);
    expect(selectionFromDrag([0, 0], 1.6 * CELL, 0, CELL, 8, 8)).toHaveLength(3);
  });

  test('reverse (up-left) diagonal drag', () => {
    expect(selectionFromDrag([3, 3], -2 * CELL, -2 * CELL, CELL, 8, 8)).toEqual([
      [3, 3],
      [2, 2],
      [1, 1],
    ]);
  });

  test('stops at the grid edge', () => {
    expect(selectionFromDrag([0, 6], 10 * CELL, 0, CELL, 8, 8)).toEqual([
      [0, 6],
      [0, 7],
    ]);
  });
});

describe('pointToCell', () => {
  test('maps and clamps to the grid', () => {
    expect(pointToCell(75, 125, CELL, 8, 8)).toEqual([2, 1]);
    expect(pointToCell(-5, 999, CELL, 8, 8)).toEqual([7, 0]);
  });
});

describe('lineBetween (Tap-Tap)', () => {
  test('aligned cells give a line', () => {
    expect(lineBetween([0, 0], [2, 2])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  test('not aligned gives null', () => {
    expect(lineBetween([0, 0], [1, 2])).toBeNull();
  });
});

describe('matchSelection', () => {
  const words: PlacedWord[] = [
    { w: 'CAFE', start: [0, 0], dir: 'E' },
    { w: 'TEA', start: [1, 0], dir: 'S' },
  ];
  const cafe: Cell[] = [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ];

  test('forward match', () => {
    expect(matchSelection(cafe, words, new Set())?.w).toBe('CAFE');
  });

  test('backward match', () => {
    expect(matchSelection([...cafe].reverse(), words, new Set())?.w).toBe('CAFE');
  });

  test('single letter never matches', () => {
    expect(matchSelection([[1, 0]], words, new Set())).toBeNull();
  });

  test('partial selection does not match', () => {
    expect(matchSelection(cafe.slice(0, 3), words, new Set())).toBeNull();
  });

  test('already found word does not match again', () => {
    expect(matchSelection(cafe, words, new Set(['CAFE']))).toBeNull();
  });
});

describe('scoring', () => {
  test('stars depend only on hints', () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(1)).toBe(2);
    expect(starsFor(4)).toBe(1);
  });

  test('coins by stars', () => {
    expect([coinsFor(1), coinsFor(2), coinsFor(3)]).toEqual([10, 15, 20]);
  });
});
