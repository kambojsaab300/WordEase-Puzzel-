import { getDailyLevel } from '../src/game/levels/dailyLevel';
import { getTodayKey, INITIAL_DAILY, useDaily } from '../src/store/daily';
import { useWallet } from '../src/store/wallet';

describe('Daily Postcard & Level', () => {
  beforeEach(() => {
    useDaily.setState({ ...INITIAL_DAILY, done: {}, streak: 0, freezes: 1 });
    useWallet.setState({ coins: 200, adFree: false });
  });

  it('generates deterministic daily levels for a given date', () => {
    const level1 = getDailyLevel('2026-10-26')!;
    const level2 = getDailyLevel('2026-10-26')!;
    expect(level1).not.toBeNull();

    expect(level1.seed).toBe(level2.seed);
    expect(level1.theme).toBe(level2.theme);
    expect(level1.grid).toEqual(level2.grid);
    expect(level1.words.length).toBeGreaterThanOrEqual(4);
    expect(level1.rows).toBe(8);
    expect(level1.cols).toBe(8);
  });

  it('awards 50 coins on daily completion and tracks streak', () => {
    const today = getTodayKey();
    const result = useDaily.getState().completeDaily(today);

    expect(result.alreadyDone).toBe(false);
    expect(result.coins).toBe(50);
    expect(result.streak).toBe(1);
    expect(useDaily.getState().isDone(today)).toBe(true);
    expect(useWallet.getState().coins).toBe(250); // 200 + 50
  });

  it('prevents double-claiming on the same date', () => {
    const today = getTodayKey();
    useDaily.getState().completeDaily(today);
    const secondTry = useDaily.getState().completeDaily(today);

    expect(secondTry.alreadyDone).toBe(true);
    expect(secondTry.coins).toBe(0);
    expect(useWallet.getState().coins).toBe(250);
  });
});
