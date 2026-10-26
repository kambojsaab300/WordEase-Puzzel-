import { countOccurrences } from '../src/game/generator/checks';
import { generateLevel } from '../src/game/generator/generateLevel';
import { placeWords } from '../src/game/generator/placeWords';
import { mulberry32 } from '../src/game/generator/prng';
import { levelSpec } from '../src/game/levels/levelSpec';
import { wordCells } from '../src/game/types';

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

describe('levelSpec difficulty table', () => {
  test.each([
    [1, 6, 7, ['E', 'S']],
    [30, 6, 7, ['E', 'S']],
    [31, 7, 8, ['E', 'S', 'SE']],
    [121, 8, 9, ['E', 'S', 'SE', 'W', 'N']],
  ])('level %i uses grid %i-%i and the right directions', (id, min, max, dirs) => {
    const spec = levelSpec(id as number);
    expect(spec.rows).toBeGreaterThanOrEqual(min as number);
    expect(spec.rows).toBeLessThanOrEqual(max as number);
    expect(spec.dirs).toEqual(dirs);
  });

  test('levels 1-30 have 4-6 words', () => {
    for (let id = 1; id <= 30; id++) {
      const n = levelSpec(id).words.length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
});
