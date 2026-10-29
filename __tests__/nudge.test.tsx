import ReactTestRenderer from 'react-test-renderer';
import { QUITS_BEFORE_NUDGE, shouldOfferNudge, STUCK_AFTER_MS } from '../src/game/engine/nudge';
import { sanitizeSaved } from '../src/game/engine/restore';
import { starsFor } from '../src/game/engine/scoring';
import { getLevel } from '../src/game/levels/levelRepo';
import { wordCells } from '../src/game/types';
import { useLevelGame } from '../src/screens/level/useLevelGame';
import { useNudgeOffer } from '../src/screens/level/useNudgeOffer';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';

describe('nudge rules', () => {
  const base = { stuck: false, quits: 0, foundSinceOpen: 0, used: false, wordsLeft: 3 };

  test('a stuck player is offered help', () => {
    expect(shouldOfferNudge(base)).toBe(false);
    expect(shouldOfferNudge({ ...base, stuck: true })).toBe(true);
  });

  test('a level left twice offers help at once, until the first word', () => {
    expect(shouldOfferNudge({ ...base, quits: QUITS_BEFORE_NUDGE })).toBe(true);
    expect(shouldOfferNudge({ ...base, quits: QUITS_BEFORE_NUDGE, foundSinceOpen: 1 })).toBe(false);
    expect(shouldOfferNudge({ ...base, quits: QUITS_BEFORE_NUDGE - 1 })).toBe(false);
  });

  test('never twice, and never with nothing left to find (negative)', () => {
    expect(shouldOfferNudge({ ...base, stuck: true, used: true })).toBe(false);
    expect(shouldOfferNudge({ ...base, stuck: true, wordsLeft: 0 })).toBe(false);
  });
});

describe('free nudge in a level', () => {
  type Game = ReturnType<typeof useLevelGame>;
  const ref: { current: Game | null } = { current: null };
  function Harness() {
    ref.current = useLevelGame(3);
    return null;
  }
  const game = () => ref.current as Game;
  const act = (fn: () => void) => ReactTestRenderer.act(fn);

  beforeEach(() => {
    useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
    useWallet.setState({ coins: 200, adFree: false });
    act(() => {
      ReactTestRenderer.create(<Harness />);
    });
  });

  test('is a spotlight that costs no coins and no star', () => {
    act(() => {
      expect(game().takeFreeNudge()).toBe(true);
    });
    expect(game().hints).toEqual([{ word: game().level.words[0].w, kind: 'spotlight', free: true }]);
    expect(useWallet.getState().coins).toBe(200);
    expect(game().paidHints).toBe(0);
    expect(starsFor(game().paidHints)).toBe(3);
  });

  test('comes once per attempt; paid hints still count (negative)', () => {
    act(() => {
      game().takeFreeNudge();
    });
    act(() => {
      expect(game().takeFreeNudge()).toBe(false);
    });
    act(() => {
      expect(game().buyHint('spotlight')).toBe('ok');
    });
    expect(game().freeNudgeUsed).toBe(true);
    expect(game().paidHints).toBe(1);
  });

  test('survives closing the app mid-level', () => {
    const level = getLevel(3);
    const saved = sanitizeSaved(level, { hints: [{ word: level.words[0].w, kind: 'spotlight', free: true }] });
    expect(saved.hints[0].free).toBe(true);
  });

  test('restart gives the attempt its free nudge back', () => {
    act(() => {
      game().takeFreeNudge();
    });
    act(() => game().restart());
    expect(game().freeNudgeUsed).toBe(false);
  });

  test('finding words never gets blocked by a free nudge', () => {
    act(() => {
      game().takeFreeNudge();
    });
    for (const pw of game().level.words) {
      act(() => {
        game().select(wordCells(pw));
      });
    }
    expect(game().allFound).toBe(true);
  });
});

describe('useNudgeOffer', () => {
  let played = 0;
  const elapsedMs = () => played;
  type Props = { foundCount: number; quits?: number; used?: boolean; active?: boolean };
  const offered: { current: boolean } = { current: false };
  function Harness({ foundCount, quits = 0, used = false, active = true }: Props) {
    offered.current = useNudgeOffer({ elapsedMs, active, foundCount, quits, used, wordsLeft: 5 - foundCount });
    return null;
  }
  let tree: ReactTestRenderer.ReactTestRenderer;
  const mount = (props: Props) =>
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<Harness {...props} />);
    });
  const update = (props: Props) => ReactTestRenderer.act(() => tree.update(<Harness {...props} />));
  const playFor = (ms: number) =>
    ReactTestRenderer.act(() => {
      played += ms;
      jest.advanceTimersByTime(ms);
    });

  beforeEach(() => {
    jest.useFakeTimers();
    played = 0;
  });
  afterEach(() => jest.useRealTimers());

  test('offers after a minute of play without a word, and a word takes it away', () => {
    mount({ foundCount: 1 });
    playFor(STUCK_AFTER_MS - 10000);
    expect(offered.current).toBe(false);
    playFor(10000);
    expect(offered.current).toBe(true);
    update({ foundCount: 2 });
    expect(offered.current).toBe(false);
  });

  test('paused time does not make a player stuck (negative)', () => {
    mount({ foundCount: 1, active: false });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(STUCK_AFTER_MS * 2); // the play clock stood still
    });
    expect(offered.current).toBe(false);
  });

  test('a level left twice offers at once; a used nudge never shows', () => {
    mount({ foundCount: 0, quits: 2 });
    expect(offered.current).toBe(true);
    update({ foundCount: 0, quits: 2, used: true });
    expect(offered.current).toBe(false);
  });
});
