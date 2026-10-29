import { DEFAULT_PACE, estimateLevel } from '../src/game/difficulty/searchBot';
import { ALL_DIRS, LevelDef, PlacedWord } from '../src/game/types';

const level = (grid: string[], words: PlacedWord[]): LevelDef => ({
  id: 1,
  world: 1,
  theme: 'Test',
  rows: grid.length,
  cols: grid[0].length,
  grid,
  words,
  bonus: [],
  seed: 7,
  difficulty: 0,
});

const BLANK = 'XXXXXX';
const CAR_FORWARDS = level(['CARXXX', BLANK, BLANK, BLANK, BLANK, BLANK], [{ w: 'CAR', start: [0, 0], dir: 'E' }]);
const CAR_BACKWARDS = level(['RACXXX', BLANK, BLANK, BLANK, BLANK, BLANK], [{ w: 'CAR', start: [0, 2], dir: 'W' }]);

describe('searchBot', () => {
  test('same level always gets the same estimate', () => {
    expect(estimateLevel(CAR_FORWARDS, ALL_DIRS)).toEqual(estimateLevel(CAR_FORWARDS, ALL_DIRS));
  });

  test('a backwards word takes longer than the same word forwards', () => {
    expect(estimateLevel(CAR_BACKWARDS, ALL_DIRS).median).toBeGreaterThan(estimateLevel(CAR_FORWARDS, ALL_DIRS).median);
  });

  test('decoy first letters slow the hunt down', () => {
    const decoys = level(
      ['CARXCX', 'CXCXCX', BLANK, 'XCXCXC', BLANK, 'CXCXCX'],
      [{ w: 'CAR', start: [0, 0], dir: 'E' }],
    );
    expect(estimateLevel(decoys, ALL_DIRS).median).toBeGreaterThan(estimateLevel(CAR_FORWARDS, ALL_DIRS).median);
  });

  test('near-miss starts cost more than plain decoys', () => {
    const plain = level(['CARXXX', BLANK, 'CXXXXX', BLANK, 'CXXXXX', BLANK], [{ w: 'CAR', start: [0, 0], dir: 'E' }]);
    const nearMiss = level(['CARXXX', BLANK, 'CAXXXX', BLANK, 'CAXXXX', BLANK], [{ w: 'CAR', start: [0, 0], dir: 'E' }]);
    expect(estimateLevel(nearMiss, ['E', 'S']).median).toBeGreaterThan(estimateLevel(plain, ['E', 'S']).median);
  });

  test('more words take longer', () => {
    const two = level(
      ['CARXXX', BLANK, 'BUSXXX', BLANK, BLANK, BLANK],
      [
        { w: 'CAR', start: [0, 0], dir: 'E' },
        { w: 'BUS', start: [2, 0], dir: 'E' },
      ],
    );
    const four = level(
      ['CARXXX', BLANK, 'BUSXXX', BLANK, 'VANXXX', 'JETXXX'],
      [
        { w: 'CAR', start: [0, 0], dir: 'E' },
        { w: 'BUS', start: [2, 0], dir: 'E' },
        { w: 'VAN', start: [4, 0], dir: 'E' },
        { w: 'JET', start: [5, 0], dir: 'E' },
      ],
    );
    expect(estimateLevel(four, ALL_DIRS).median).toBeGreaterThan(estimateLevel(two, ALL_DIRS).median);
  });

  test('a direction the player was never taught is never checked, so the word needs a hint', () => {
    expect(estimateLevel(CAR_BACKWARDS, ['E', 'S']).hints).toBe(1);
  });

  test('a player who never notices a word takes a hint for every word', () => {
    const blind = { ...DEFAULT_PACE, noticeForwards: 0, noticeBackwards: 0 };
    expect(estimateLevel(CAR_FORWARDS, ALL_DIRS, 50, blind).hints).toBe(1);
  });

  test('the slow-player time is never below the typical time', () => {
    const { median, p90 } = estimateLevel(CAR_BACKWARDS, ALL_DIRS);
    expect(p90).toBeGreaterThanOrEqual(median);
  });

  test('the last shipped level is far harder than the first', () => {
    const first: LevelDef = require('../assets/levels/en/world-01.json')[0];
    const last: LevelDef = require('../assets/levels/en/world-20.json')[59];
    const easy = estimateLevel(first, ['E', 'S']);
    const hard = estimateLevel(last, ALL_DIRS);
    expect(hard.median).toBeGreaterThan(easy.median * 3);
  });
});
