/**
 * Drives the real level logic (useLevelGame) through a game session, the way the
 * Level screen does, including the awkward cases a player can hit.
 */
import ReactTestRenderer from 'react-test-renderer';
import { getLevel, DAILY_LEVEL_ID } from '../src/game/levels/levelRepo';
import { wordCells } from '../src/game/types';
import { useLevelGame } from '../src/screens/level/useLevelGame';
import { getTodayKey, INITIAL_DAILY, useDaily } from '../src/store/daily';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';

type Game = ReturnType<typeof useLevelGame>;

function play(levelId: number) {
  const ref: { current: Game | null } = { current: null };
  function Harness() {
    ref.current = useLevelGame(levelId);
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });
  const game = () => ref.current as Game;
  const act = (fn: () => void) => ReactTestRenderer.act(fn);
  return { game, act, unmount: () => ReactTestRenderer.act(() => renderer.unmount()) };
}

beforeEach(() => {
  useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
  useWallet.setState({ coins: 200, adFree: false });
  useDaily.setState({ ...INITIAL_DAILY, done: {} });
});

describe('a level session', () => {
  test('finding every word completes the level', () => {
    const { game, act } = play(3);
    const words = game().level.words;
    for (const pw of words) {
      act(() => {
        expect(game().select(wordCells(pw)).kind).toBe('word');
      });
    }
    expect(game().allFound).toBe(true);
    expect(game().foundWords).toHaveLength(words.length);
  });

  test('selecting the same word twice before a re-render counts it once (negative)', () => {
    const { game, act } = play(3);
    const pw = game().level.words[0];
    act(() => {
      const select = game().select;
      select(wordCells(pw));
      select(wordCells(pw)); // same stale closure, like a fast double gesture
    });
    expect(game().found).toEqual([pw.w]);
  });

  test('a wrong line is a miss and a single cell is ignored (negative)', () => {
    const { game, act } = play(3);
    act(() => {
      expect(game().select([[0, 0]]).kind).toBe('none');
      expect(game().select([]).kind).toBe('none');
    });
    expect(game().found).toEqual([]);
  });

  test('progress is saved after every word and restored on reopen', () => {
    const first = play(4);
    const pw = first.game().level.words[0];
    first.act(() => {
      first.game().select(wordCells(pw));
    });
    expect(useProgress.getState().inProgress).toMatchObject({ levelId: 4, found: [pw.w] });
    first.unmount();

    const again = play(4);
    expect(again.game().found).toEqual([pw.w]);
  });

  test("another level's save is not restored here (negative)", () => {
    useProgress.getState().saveInProgress({ levelId: 9, found: ['ANY'], bonusFound: [], hints: [] });
    const { game } = play(4);
    expect(game().found).toEqual([]);
  });

  test('a damaged save with unknown words cannot crash the grid (negative)', () => {
    const real = getLevel(4).words[0].w;
    useProgress.getState().saveInProgress({ levelId: 4, found: ['BOGUS', real, real], bonusFound: ['ZZZ'], hints: [] });
    const { game } = play(4);
    expect(game().found).toEqual([real]);
    expect(game().foundWords.every(f => f.word && f.word.w)).toBe(true);
  });

  test('a bonus word pays one coin once, even if selected twice', () => {
    const level = getLevel(1);
    const bonus = level.bonus[0];
    expect(bonus).toBeDefined();
    // find the bonus word's cells in the grid
    const cells = findCells(level.grid, bonus);
    const { game, act } = play(1);
    act(() => {
      const select = game().select;
      expect(select(cells).kind).toBe('bonus');
      expect(select(cells).kind).not.toBe('bonus');
    });
    expect(useWallet.getState().coins).toBe(201);
  });

  test('hints: spend coins, reveal finds the word; no coins or no words left are refused', () => {
    const { game, act } = play(3);
    act(() => {
      expect(game().buyHint('spotlight')).toBe('ok');
    });
    expect(useWallet.getState().coins).toBe(175);

    act(() => {
      expect(game().buyHint('reveal')).toBe('ok');
    });
    expect(game().found).toHaveLength(1);
    expect(useWallet.getState().coins).toBe(115);

    useWallet.setState({ coins: 10 });
    act(() => {
      expect(game().buyHint('spotlight')).toBe('no-coins');
    });
    expect(useWallet.getState().coins).toBe(10); // nothing taken

    useWallet.setState({ coins: 1000 });
    for (const pw of game().level.words) {
      act(() => {
        game().select(wordCells(pw));
      });
    }
    act(() => {
      expect(game().buyHint('reveal')).toBe('none-left');
    });
    expect(useWallet.getState().coins).toBe(1000);
  });
});

describe('Daily Postcard session', () => {
  test('uses its own save slot, so a half-done map level survives', () => {
    useProgress.getState().saveInProgress({ levelId: 7, found: [getLevel(7).words[0].w], bonusFound: [], hints: [] });
    const { game, act } = play(DAILY_LEVEL_ID);
    act(() => {
      game().select(wordCells(game().level.words[0]));
    });
    expect(useDaily.getState().inProgress?.dayKey).toBe(getTodayKey());
    expect(useProgress.getState().inProgress?.levelId).toBe(7);
  });

  test("yesterday's half-done daily is not restored into today's puzzle (negative)", () => {
    useDaily.setState({
      inProgress: { levelId: DAILY_LEVEL_ID, dayKey: '2000-01-01', found: ['CAFE', 'TEA'], bonusFound: [], hints: [] },
    });
    const { game } = play(DAILY_LEVEL_ID);
    expect(game().found).toEqual([]);
  });
});

function findCells(grid: string[], word: string) {
  const dirs = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [-1, 1], [1, -1]];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      for (const [dr, dc] of dirs) {
        const cells: [number, number][] = [];
        for (let i = 0; i < word.length; i++) cells.push([r + dr * i, c + dc * i]);
        if (cells.every(([rr, cc], i) => grid[rr]?.[cc] === word[i])) return cells;
      }
    }
  }
  throw new Error(`${word} not in grid`);
}
