import ReactTestRenderer from 'react-test-renderer';
import { blocklistHits, countOccurrences } from '../src/game/generator/checks';
import { getLevel, meaningOf, SHIPPED_LEVELS } from '../src/game/levels/levelRepo';
import { fitGridSize } from '../src/game/levels/textSizeVariant';
import { wordCells } from '../src/game/types';
import { useLevelGame } from '../src/screens/level/useLevelGame';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';
import {
  FOUND_MARKS,
  FOUND_PATTERNS,
  gridLetterSize,
  HUGE_MAX_GRID,
  MAX_CELL,
  textSizeIndex,
} from '../src/ui/a11y';
import { colors, fontSizes } from '../src/ui/theme';

const BLOCKLIST = new Set<string>(require('../src/game/generator/blocklist.en.json'));

describe('text size', () => {
  test('setting maps to Normal / Large / Huge', () => {
    expect([textSizeIndex(1), textSizeIndex(1.25), textSizeIndex(1.5)]).toEqual([0, 1, 2]);
  });

  test('odd stored values fall back safely (negative)', () => {
    expect(textSizeIndex(0)).toBe(0);
    expect(textSizeIndex(NaN)).toBe(0);
    expect(textSizeIndex(9)).toBe(2);
  });

  test('grid letters follow the flow sizes (28 / 34 / 42) when the cell is big enough', () => {
    expect(gridLetterSize(64, 0, fontSizes.gridLetter)).toBe(28);
    expect(gridLetterSize(64, 1, fontSizes.gridLetter)).toBe(34);
    expect(gridLetterSize(72, 2, fontSizes.gridLetter)).toBe(42);
  });

  test('letters never overflow a small cell and never get unreadably tiny (negative)', () => {
    expect(gridLetterSize(30, 2, fontSizes.gridLetter)).toBe(24);
    expect(gridLetterSize(5, 2, fontSizes.gridLetter)).toBe(12);
  });

  test('bigger text allows bigger cells', () => {
    expect(MAX_CELL[0]).toBeLessThan(MAX_CELL[1]);
    expect(MAX_CELL[1]).toBeLessThan(MAX_CELL[2]);
  });
});

describe('Huge text keeps grids at 10x10', () => {
  const bigLevels: number[] = [];
  for (let id = 1; id <= SHIPPED_LEVELS; id++) if (getLevel(id).rows > HUGE_MAX_GRID) bigLevels.push(id);

  test('there are big levels to check', () => {
    expect(bigLevels.length).toBeGreaterThan(50);
  });

  test('every bigger level gets a safe 10x10 version with its own words', () => {
    const problems: string[] = [];
    for (const id of bigLevels) {
      const full = getLevel(id);
      const small = fitGridSize(full, HUGE_MAX_GRID);
      const fullWords = new Set(full.words.map(w => w.w));
      if (small.rows !== 10 || small.cols !== 10) problems.push(`${id}: not 10x10`);
      if (small.words.length < 6) problems.push(`${id}: only ${small.words.length} words`);
      for (const pw of small.words) {
        if (!fullWords.has(pw.w)) problems.push(`${id}: foreign word ${pw.w}`);
        if (countOccurrences(small.grid, pw.w) !== 1) problems.push(`${id}: ${pw.w} not exactly once`);
        if (!meaningOf(pw.w)) problems.push(`${id}: ${pw.w} has no meaning`);
      }
      if (blocklistHits(small, BLOCKLIST).length) problems.push(`${id}: blocklisted word`);
      if (small.id !== id) problems.push(`${id}: id changed`);
    }
    expect(problems).toEqual([]);
  });

  test('the same level always gets the same Huge version', () => {
    const id = bigLevels[0];
    expect(fitGridSize(getLevel(id), 10)).toEqual(fitGridSize(getLevel(id), 10));
  });

  test('levels already 10x10 or smaller are untouched', () => {
    const level = getLevel(5);
    expect(fitGridSize(level, 10)).toBe(level);
  });

  test('if almost nothing fits, the original level is kept rather than an empty puzzle (negative)', () => {
    const level = getLevel(bigLevels[0]);
    expect(fitGridSize(level, 2)).toBe(level);
  });
});

describe('colour-blind mode', () => {
  test('one pattern and one symbol per found-word colour, all different', () => {
    expect(FOUND_PATTERNS).toHaveLength(colors.found.length);
    expect(FOUND_MARKS).toHaveLength(colors.found.length);
    expect(new Set(FOUND_MARKS).size).toBe(FOUND_MARKS.length);
    expect(new Set(FOUND_PATTERNS.map(p => p.join(','))).size).toBe(FOUND_PATTERNS.length);
  });
});

describe('playing a big level in Huge mode', () => {
  beforeEach(() => {
    useProgress.setState({ currentLevel: 1200, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
    useWallet.setState({ coins: 200, adFree: false });
  });

  test('the grid is 10x10 and every word can be found to finish', () => {
    let id = 1;
    while (getLevel(id).rows <= 10) id++;
    const ref: { current: ReturnType<typeof useLevelGame> | null } = { current: null };
    function Harness() {
      ref.current = useLevelGame(id, 2);
      return null;
    }
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Harness />);
    });
    const game = () => ref.current!;
    expect(game().level.rows).toBe(10);
    for (const pw of game().level.words) {
      ReactTestRenderer.act(() => {
        expect(game().select(wordCells(pw)).kind).toBe('word');
      });
    }
    expect(game().allFound).toBe(true);
  });
});
