import ReactTestRenderer from 'react-test-renderer';
import { fitPace, paceSamples, PLAY_CSV_HEADER, playDataCsv } from '../src/game/difficulty/calibration';
import { PlayClock } from '../src/game/engine/playClock';
import { usePlayRecord } from '../src/screens/level/usePlayRecord';
import { AnalyticsManager } from '../src/services/analytics/AnalyticsManager';
import { attemptMs, usePlayStats } from '../src/store/playStats';
import { resetAllProgress } from '../src/store/reset';

beforeEach(() => {
  usePlayStats.getState().clear();
  AnalyticsManager.clearForTesting();
});

describe('PlayClock', () => {
  test('counts only running time', () => {
    const clock = new PlayClock();
    clock.start(1000);
    clock.stop(4000); // 3 s played
    clock.stop(9000); // stopping twice adds nothing
    clock.start(10000);
    expect(clock.elapsedMs(12000)).toBe(5000);
  });

  test('carries time from an earlier visit and restarts from zero', () => {
    const clock = new PlayClock(7000);
    clock.start(0);
    expect(clock.elapsedMs(1000)).toBe(8000);
    clock.reset(1000);
    expect(clock.elapsedMs(1500)).toBe(500);
  });
});

describe('play stats store', () => {
  test('opening another level drops the old attempt', () => {
    const s = usePlayStats.getState();
    s.opened(5);
    s.saveAttempt(5, 4000);
    expect(attemptMs(5)).toBe(4000);
    s.opened(6);
    expect(attemptMs(5)).toBe(0);
    expect(usePlayStats.getState().levels[5].opens).toBe(1);
  });

  test('a quit keeps the time for the next visit', () => {
    usePlayStats.getState().opened(5);
    usePlayStats.getState().quit(5, 3000);
    usePlayStats.getState().opened(5);
    expect(usePlayStats.getState().levels[5]).toMatchObject({ opens: 2, quits: 1, wins: 0 });
    expect(attemptMs(5)).toBe(3000);
  });

  test('only the first win is kept as the timed one', () => {
    const s = usePlayStats.getState();
    s.won(5, { seconds: 40, hints: 1, first: true, resized: false });
    s.won(5, { seconds: 12, hints: 0, first: true, resized: false });
    expect(usePlayStats.getState().levels[5]).toMatchObject({ wins: 2, firstWin: { seconds: 40, hints: 1 } });
    expect(usePlayStats.getState().attempt).toBeUndefined();
  });

  test('a replay of a level won before play data existed is not a first win', () => {
    usePlayStats.getState().won(9, { seconds: 10, hints: 0, first: false, resized: false });
    expect(usePlayStats.getState().levels[9].firstWin).toBeUndefined();
  });

  test('Reset All Progress clears play data too', () => {
    usePlayStats.getState().won(5, { seconds: 40, hints: 0, first: true, resized: false });
    resetAllProgress();
    expect(usePlayStats.getState().levels).toEqual({});
  });
});

describe('usePlayRecord', () => {
  type Props = { active: boolean; daily?: boolean };
  const record: { current: ReturnType<typeof usePlayRecord> | null } = { current: null };
  function Harness({ active, daily = false }: Props) {
    record.current = usePlayRecord({ levelId: 7, world: 1, isDaily: daily, resized: false, active, foundCount: 2 });
    return null;
  }
  const mount = (props: Props) => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<Harness {...props} />);
    });
    return {
      update: (next: Props) => ReactTestRenderer.act(() => tree.update(<Harness {...next} />)),
      unmount: () => ReactTestRenderer.act(() => tree.unmount()),
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => jest.useRealTimers());

  test('a win records active seconds only, and no quit', () => {
    const screen = mount({ active: true });
    jest.setSystemTime(5000);
    screen.update({ active: false }); // paused for a while
    jest.setSystemTime(60000);
    screen.update({ active: true });
    jest.setSystemTime(63000);
    ReactTestRenderer.act(() => {
      expect(record.current!.finish(1, true)).toBe(8);
    });
    screen.unmount();
    expect(usePlayStats.getState().levels[7]).toMatchObject({ opens: 1, quits: 0, wins: 1, firstWin: { seconds: 8 } });
    const complete = AnalyticsManager.getRecentEvents().filter(e => e.event.name === 'level_quit');
    expect(complete).toHaveLength(0);
  });

  test('leaving early is a quit, and coming back continues the clock', () => {
    const first = mount({ active: true });
    jest.setSystemTime(3000);
    first.unmount();
    expect(usePlayStats.getState().levels[7].quits).toBe(1);
    expect(AnalyticsManager.getRecentEvents().map(e => e.event)).toContainEqual({
      name: 'level_quit',
      params: { level_id: 7, words_found: 2, seconds: 3 },
    });

    const again = mount({ active: true });
    jest.setSystemTime(5000);
    ReactTestRenderer.act(() => {
      expect(record.current!.finish(0, true)).toBe(5);
    });
    again.unmount();
  });

  test('the Daily puzzle is logged but kept out of play data', () => {
    const screen = mount({ active: true, daily: true });
    screen.unmount();
    expect(usePlayStats.getState().levels).toEqual({});
    expect(AnalyticsManager.getRecentEvents().some(e => e.event.name === 'level_start')).toBe(true);
  });
});

describe('calibration', () => {
  const plays = {
    3: { opens: 1, quits: 0, wins: 1, firstWin: { seconds: 30, hints: 0, resized: false } },
    4: { opens: 2, quits: 1, wins: 1, firstWin: { seconds: 50, hints: 1, resized: true } },
    5: { opens: 1, quits: 1, wins: 0 },
    1500: { opens: 1, quits: 0, wins: 1, firstWin: { seconds: 90, hints: 0, resized: false } },
  };
  const bot = (id: number) => (id <= 1200 ? id * 10 : undefined);

  test('samples keep first wins on the shipped grid that have a bot time', () => {
    expect(paceSamples(plays, bot)).toEqual([{ levelId: 3, seconds: 30, botSeconds: 30 }]);
  });

  test('the export has one line per level after the header', () => {
    expect(playDataCsv(plays, bot).split('\n')).toEqual([
      PLAY_CSV_HEADER,
      '3,30,0,30,1,0,1,0',
      '4,50,1,40,2,1,1,1',
      '5,,,50,1,1,0,',
      '1500,90,0,,1,0,1,0',
    ]);
  });

  test('the scale is the typical ratio; one slow outlier barely moves it', () => {
    const samples = [10, 20, 30, 40, 50].map(b => ({ levelId: b, seconds: b * 0.5, botSeconds: b }));
    samples.push({ levelId: 99, seconds: 900, botSeconds: 60 }); // a phone call mid-level
    const fit = fitPace(samples)!;
    expect(fit.scale).toBeCloseTo(0.5, 1);
    expect(fit.n).toBe(6);
  });

  test('rank match is 1 when the player finds levels hard in the bot order', () => {
    const samples = [10, 20, 30, 40, 50].map(b => ({ levelId: b, seconds: b * 0.7, botSeconds: b }));
    expect(fitPace(samples)!.rankMatch).toBeCloseTo(1);
    expect(fitPace(samples.slice(0, 4))!.rankMatch).toBeNull();
  });

  test('no samples, no fit', () => {
    expect(fitPace([])).toBeNull();
  });
});
