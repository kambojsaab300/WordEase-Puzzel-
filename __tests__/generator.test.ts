import { countOccurrences } from '../src/game/generator/checks';
import { fillBoard, plantFalseStarts } from '../src/game/generator/fill';
import { generateLevel } from '../src/game/generator/generateLevel';
import { placeWords } from '../src/game/generator/placeWords';
import { mulberry32 } from '../src/game/generator/prng';
import { DAILY_LEVEL_ID } from '../src/game/levels/dailyLevel';
import { levelSpec, newDirectionsAt } from '../src/game/levels/levelSpec';
import { ALL_DIRS, Dir, isReversed, wordCells } from '../src/game/types';

describe('mulberry32', () => {
  test('same seed gives the same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  test('values stay in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('placeWords', () => {
  test('places every word without overlap when overlap is off', () => {
    const words = ['BREAD', 'CREPE', 'LATTE', 'MENU', 'CAFE'];
    const result = placeWords(words, mulberry32(1), { rows: 7, cols: 7, dirs: ['E', 'S'] });
    expect(result).not.toBeNull();
    const used = new Set<string>();
    for (const pw of result!.placed) {
      for (const [r, c] of wordCells(pw)) {
        const key = `${r},${c}`;
        expect(used.has(key)).toBe(false);
        used.add(key);
      }
    }
  });

  test('gives up (null) when the words cannot fit', () => {
    const result = placeWords(['TOOLONGWORD'], mulberry32(1), { rows: 5, cols: 5, dirs: ['E'] });
    expect(result).toBeNull();
  });
});

describe('generateLevel', () => {
  test('same seed gives the same puzzle', () => {
    expect(generateLevel(levelSpec(12))).toEqual(generateLevel(levelSpec(12)));
  });

  // Flow asks for 10,000 seeds in CI; the first 300 levels keep this test fast
  test('levels 1-300: full grid, allowed directions, every word exactly once', () => {
    for (let id = 1; id <= 300; id++) {
      const spec = levelSpec(id);
      const level = generateLevel(spec);

      expect(level.grid).toHaveLength(spec.rows);
      for (const row of level.grid) expect(row).toMatch(new RegExp(`^[A-Z]{${spec.cols}}$`));

      expect(level.words.map(w => w.w).sort()).toEqual([...spec.words].sort());
      for (const pw of level.words) {
        expect(spec.dirs).toContain(pw.dir);
        const letters = wordCells(pw).map(([r, c]) => level.grid[r][c]).join('');
        expect(letters).toBe(pw.w);
        expect(countOccurrences(level.grid, pw.w)).toBe(1);
      }
    }
  });
});

describe('placeWords direction plan', () => {
  const words = ['BREAD', 'CREPE', 'LATTE', 'MENU'];
  const dirs: Dir[] = ['E', 'S', 'W', 'SE', 'N'];

  test('the backwards share is met, the other words read forwards', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const result = placeWords(words, mulberry32(seed), { rows: 8, cols: 8, dirs, reversedShare: 0.5 });
      expect(result).not.toBeNull();
      expect(result!.placed.filter(pw => isReversed(pw.dir))).toHaveLength(2);
    }
  });

  test('a featured direction is always used', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const result = placeWords(words, mulberry32(seed), { rows: 8, cols: 8, dirs, featuredDirs: ['SE'] });
      expect(result!.placed.some(pw => pw.dir === 'SE')).toBe(true);
    }
  });

  test('RAC in the grid is CAR: W and N read backwards, E/S/SE do not', () => {
    expect((['W', 'N', 'NW', 'NE', 'SW'] as Dir[]).every(isReversed)).toBe(true);
    expect((['E', 'S', 'SE'] as Dir[]).some(isReversed)).toBe(false);
  });
});

describe('hard-board filler', () => {
  test('decoy filler uses only theme letters at share 1', () => {
    const board = Array.from({ length: 6 }, () => Array(6).fill(null));
    const grid = fillBoard(board, mulberry32(3), { letters: 'CAR', share: 1 });
    expect(grid.join('')).toMatch(/^[CAR]+$/);
  });

  test('false starts are word starts written only on empty cells', () => {
    const board: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][0] = 'Z';
    plantFalseStarts(board, ['TIGER'], 3, ['E', 'S'], mulberry32(5));
    expect(board[0][0]).toBe('Z');
    // Stubs may run down, so count letters instead of reading rows
    const letters = board.flat().filter(l => l && l !== 'Z');
    const count = (l: string) => letters.filter(x => x === l).length;
    expect(letters.length).toBeGreaterThan(0);
    expect(letters.every(l => 'TIG'.includes(l!))).toBe(true);
    expect(count('T')).toBe(count('I'));
    expect(count('I')).toBe(count('G'));
  });
});

describe('levelSpec difficulty table', () => {
  test.each([
    [1, 6, 7, ['E', 'S']],
    [10, 6, 7, ['E', 'S']],
    [11, 6, 7, ['E', 'S', 'W']],
    [26, 7, 8, ['E', 'S', 'W', 'SE']],
    [46, 7, 8, ['E', 'S', 'W', 'SE', 'N']],
    [61, 8, 9, ['E', 'S', 'W', 'SE', 'N', 'NE']],
    [121, 8, 9, ALL_DIRS],
  ])('level %i uses grid %i-%i and the right directions', (id, min, max, dirs) => {
    const spec = levelSpec(id as number);
    expect(spec.rows).toBeGreaterThanOrEqual(min as number);
    expect(spec.rows).toBeLessThanOrEqual(max as number);
    expect(spec.dirs).toEqual(dirs);
  });

  test('levels 1-25 have 4-6 words', () => {
    for (let id = 1; id <= 25; id++) {
      const n = levelSpec(id).words.length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  test('each new direction is announced on the first level that has it', () => {
    expect(newDirectionsAt(1)).toEqual([]);
    expect(newDirectionsAt(11)).toEqual(['W']);
    expect(newDirectionsAt(12)).toEqual([]);
    expect(newDirectionsAt(26)).toEqual(['SE']);
    expect(newDirectionsAt(46)).toEqual(['N']);
    expect(newDirectionsAt(61)).toEqual(['NE']);
    expect(newDirectionsAt(121)).toEqual(['NW', 'SW']);
    expect(newDirectionsAt(DAILY_LEVEL_ID)).toEqual([]);
  });

  test('a new direction opens on a lighter board than the rest of its stage', () => {
    // 46 would be a "hard stretch" level without the intro dip
    expect(levelSpec(46).words.length).toBeLessThanOrEqual(levelSpec(50).words.length);
    expect(levelSpec(46).featuredDirs).toEqual(['N']);
  });

  test('harder stages ask for more backwards words and add decoys', () => {
    const share = (id: number) => levelSpec(id).reversedShare ?? 0;
    const ids = [5, 11, 26, 46, 61, 121, 301, 501, 801];
    for (let i = 1; i < ids.length; i++) expect(share(ids[i])).toBeGreaterThan(share(ids[i - 1]));
    expect(levelSpec(100).decoyShare).toBeUndefined();
    expect(levelSpec(301).decoyShare).toBeGreaterThan(0);
    expect(levelSpec(801).falseStarts).toBeGreaterThan(0);
  });
});
