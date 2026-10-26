import { blocklistHits, countOccurrences } from '../src/game/generator/checks';
import { getDailyLevel } from '../src/game/levels/dailyLevel';
import {
  dailyCoinsFor,
  daysBetween,
  INITIAL_DAILY,
  useDaily,
  weekKeyOf,
} from '../src/store/daily';
import { useWallet } from '../src/store/wallet';

const BLOCKLIST = new Set<string>(require('../src/game/generator/blocklist.en.json'));

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

describe('date helpers', () => {
  test.each([
    ['2026-10-26', '2026-10-27', 1],
    ['2026-10-31', '2026-11-01', 1], // month end
    ['2026-12-31', '2027-01-01', 1], // year end
    ['2028-02-28', '2028-03-01', 2], // leap year
    ['2026-03-28', '2026-03-30', 2], // across a DST change in Europe
    ['2026-10-27', '2026-10-26', -1], // clock moved back
  ])('%s -> %s is %i days', (a, b, n) => {
    expect(daysBetween(a, b)).toBe(n);
  });

  test('weeks start on Monday', () => {
    expect(weekKeyOf('2026-10-26')).toBe(weekKeyOf('2026-11-01')); // Mon..Sun
    expect(weekKeyOf('2026-11-01')).not.toBe(weekKeyOf('2026-11-02')); // Sun -> Mon
  });

  test('reward cycle: 50, 50, 100, 50, 50, 50, 300, then repeats', () => {
    const coins = Array.from({ length: 14 }, (_, i) => dailyCoinsFor(i + 1));
    expect(coins).toEqual([50, 50, 100, 50, 50, 50, 300, 50, 50, 100, 50, 50, 50, 300]);
  });
});

describe('daily streak', () => {
  beforeEach(() => {
    useDaily.setState({ ...INITIAL_DAILY, done: {} });
    useWallet.setState({ coins: 200, adFree: false });
  });

  test('first ever claim starts the streak at 1 and pays 50', () => {
    const r = useDaily.getState().completeDaily('2026-10-26');
    expect(r).toEqual({ coins: 50, streak: 1, alreadyDone: false });
    expect(useWallet.getState().coins).toBe(250);
  });

  test('seven days in a row reach the 300-coin day', () => {
    let day = '2026-10-26';
    let last = { coins: 0, streak: 0, alreadyDone: false };
    for (let i = 0; i < 7; i++) {
      last = useDaily.getState().completeDaily(day);
      day = addDays(day, 1);
    }
    expect(last).toEqual({ coins: 300, streak: 7, alreadyDone: false });
  });

  test('same day twice pays once (negative)', () => {
    useDaily.getState().completeDaily('2026-10-26');
    const again = useDaily.getState().completeDaily('2026-10-26');
    expect(again.alreadyDone).toBe(true);
    expect(useWallet.getState().coins).toBe(250);
  });

  test('phone date moved back before the last claim pays nothing (negative)', () => {
    useDaily.getState().completeDaily('2026-10-26');
    const back = useDaily.getState().completeDaily('2026-10-20');
    expect(back).toMatchObject({ coins: 0, alreadyDone: true });
    expect(useDaily.getState().lastDay).toBe('2026-10-26');
    expect(useWallet.getState().coins).toBe(250);
  });

  test('one missed day uses the freeze and keeps the streak', () => {
    useDaily.getState().completeDaily('2026-10-26'); // Mon, refills freeze for this week
    useDaily.getState().completeDaily('2026-10-27');
    const r = useDaily.getState().completeDaily('2026-10-29'); // missed Wed
    expect(r.streak).toBe(3);
    expect(useDaily.getState().freezes).toBe(0);
  });

  test('one missed day with no freeze left resets the streak (negative)', () => {
    useDaily.getState().completeDaily('2026-10-26');
    useDaily.getState().completeDaily('2026-10-28'); // uses this week's freeze
    const r = useDaily.getState().completeDaily('2026-10-30'); // misses again, none left
    expect(r.streak).toBe(1);
  });

  test('two or more missed days reset the streak even with a freeze (negative)', () => {
    useDaily.getState().completeDaily('2026-10-26');
    const r = useDaily.getState().completeDaily('2026-10-29'); // missed 2 days
    expect(r.streak).toBe(1);
    expect(useDaily.getState().freezes).toBe(1); // freeze not wasted
  });

  test('freezes refill once a week but do not pile up', () => {
    useDaily.setState({ freezes: 0, freezeWeek: weekKeyOf('2026-10-26') });
    useDaily.getState().completeDaily('2026-10-26');
    expect(useDaily.getState().freezes).toBe(0); // same week: no refill
    useDaily.getState().completeDaily('2026-11-02'); // next Monday
    expect(useDaily.getState().freezes).toBe(1);
    useDaily.getState().completeDaily('2026-11-09');
    expect(useDaily.getState().freezes).toBe(1); // still 1, not 2
  });

  test('completing clears the saved half-done daily', () => {
    useDaily.getState().saveInProgress({
      levelId: 99999,
      dayKey: '2026-10-26',
      found: ['X'],
      bonusFound: [],
      hints: [],
    });
    useDaily.getState().completeDaily('2026-10-26');
    expect(useDaily.getState().inProgress).toBeUndefined();
  });

  test('reset clears streak, days and saved daily', () => {
    useDaily.getState().completeDaily('2026-10-26');
    useDaily.getState().reset();
    expect(useDaily.getState()).toMatchObject({ streak: 0, lastDay: '', done: {} });
  });
});

describe('daily puzzles made on the phone', () => {
  test('a whole year of daily puzzles: valid, safe and each word exactly once', () => {
    let day = '2026-01-01';
    for (let i = 0; i < 366; i++) {
      const level = getDailyLevel(day);
      expect(level).not.toBeNull();
      expect(level!.words.length).toBeGreaterThanOrEqual(4);
      expect(blocklistHits(level!, BLOCKLIST)).toEqual([]);
      for (const pw of level!.words) expect(countOccurrences(level!.grid, pw.w)).toBe(1);
      day = addDays(day, 1);
    }
  });

  test('different days give different puzzles', () => {
    expect(getDailyLevel('2026-10-26')!.grid).not.toEqual(getDailyLevel('2026-10-27')!.grid);
  });
});
