import { sanitizeSaved } from '../src/game/engine/restore';
import { blocklistHits, countOccurrences } from '../src/game/generator/checks';
import { generateCheckedLevel } from '../src/game/generator/checkedLevel';
import { getLevel } from '../src/game/levels/levelRepo';
import { STARTING_COINS } from '../src/game/engine/rewards';
import { INITIAL_DAILY, useDaily } from '../src/store/daily';
import { useProgress } from '../src/store/progress';
import { resetAllProgress } from '../src/store/reset';
import { useWallet } from '../src/store/wallet';

const BLOCKLIST = new Set<string>(require('../src/game/generator/blocklist.en.json'));

describe('restoring a saved level', () => {
  const level = getLevel(5);
  const [a, b] = level.words.map(w => w.w);

  test('a valid save comes back unchanged (positive)', () => {
    const saved = { found: [a], bonusFound: level.bonus.slice(0, 1), hints: [{ word: b, kind: 'spotlight' as const }] };
    expect(sanitizeSaved(level, saved)).toEqual(saved);
  });

  test('words from another puzzle are dropped, so the grid never gets an unknown word (negative)', () => {
    const r = sanitizeSaved(level, { found: [a, 'NOTAWORD', 'YESTERDAY'], bonusFound: ['ZZZZ'], hints: [{ word: 'GONE', kind: 'reveal' }] });
    expect(r).toEqual({ found: [a], bonusFound: [], hints: [] });
  });

  test('duplicates in a save are removed (negative)', () => {
    expect(sanitizeSaved(level, { found: [a, a, b, a] }).found).toEqual([a, b]);
  });

  test('a damaged save (wrong types, null) gives a clean empty state (negative)', () => {
    const empty = { found: [], bonusFound: [], hints: [] };
    expect(sanitizeSaved(level, null)).toEqual(empty);
    expect(sanitizeSaved(level, undefined)).toEqual(empty);
    expect(sanitizeSaved(level, { found: 'CAFE' as unknown as string[] })).toEqual(empty);
    expect(
      sanitizeSaved(level, { hints: [null, { word: a, kind: 'magic' }] as unknown as [] }),
    ).toEqual(empty);
  });
});

describe('getLevel never crashes on odd input', () => {
  test.each([0, -5, NaN, 2.7, Infinity, -Infinity])('id %p gives a playable level', id => {
    const level = getLevel(id);
    expect(level.words.length).toBeGreaterThan(0);
    expect(level.grid.length).toBe(level.rows);
  });

  test('Classic Play levels (after 1,200) pass the same safety checks', () => {
    for (let id = 1201; id <= 1215; id++) {
      const level = getLevel(id);
      expect(level.id).toBe(id);
      expect(blocklistHits(level, BLOCKLIST)).toEqual([]);
      for (const pw of level.words) expect(countOccurrences(level.grid, pw.w)).toBe(1);
    }
  });

  test('an impossible spec returns null instead of throwing (negative)', () => {
    const r = generateCheckedLevel(() => ({
      id: 1,
      world: 1,
      theme: 'x',
      words: ['MUCHTOOLONGFORTHISGRID'],
      rows: 5,
      cols: 5,
      dirs: ['E'],
      seed: 1,
      difficulty: 1,
    }));
    expect(r).toBeNull();
  });
});

describe('reset all progress', () => {
  test('clears levels, coins and streak but keeps a paid Remove Ads', () => {
    useProgress.setState({ currentLevel: 40, stars: { 1: 3 }, lastSeenWorld: 1 });
    useWallet.setState({ coins: 9999, adFree: true });
    useDaily.setState({ ...INITIAL_DAILY, streak: 5, lastDay: '2026-10-26', done: { '2026-10-26': true } });

    resetAllProgress();

    expect(useProgress.getState()).toMatchObject({ currentLevel: 1, stars: {}, inProgress: undefined });
    expect(useWallet.getState()).toMatchObject({ coins: STARTING_COINS, adFree: true });
    expect(useDaily.getState()).toMatchObject({ streak: 0, done: {} });
  });
});
