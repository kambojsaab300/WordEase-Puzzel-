import { useCallback, useEffect, useRef } from 'react';
import { PlayClock } from '../../game/engine/playClock';
import { AnalyticsManager } from '../../services/analytics/AnalyticsManager';
import { attemptMs, usePlayStats } from '../../store/playStats';

type Options = {
  levelId: number;
  world: number;
  isDaily: boolean;
  /** Played on a smaller re-made grid (Huge text), so the bot's time does not apply */
  resized: boolean;
  /** The clock runs only while this is true */
  active: boolean;
  foundCount: number;
};

/**
 * Times the level and writes what happened to the analytics log and the phone's play
 * data (opened, quit, won). The Daily puzzle is logged but kept out of the play data:
 * it is a new puzzle every day with no bot time to compare.
 */
export function usePlayRecord({ levelId, world, isDaily, resized, active, foundCount }: Options) {
  const clock = useRef<PlayClock | null>(null);
  if (clock.current === null) clock.current = new PlayClock(isDaily ? 0 : attemptMs(levelId));
  const finished = useRef(false);
  const found = useRef(foundCount);
  found.current = foundCount;

  useEffect(() => {
    const timer = clock.current!;
    AnalyticsManager.logLevelStart(levelId, world);
    if (!isDaily) usePlayStats.getState().opened(levelId);
    return () => {
      if (finished.current) return;
      timer.stop();
      const ms = timer.elapsedMs();
      AnalyticsManager.logLevelQuit(levelId, found.current, Math.round(ms / 1000));
      if (!isDaily) usePlayStats.getState().quit(levelId, ms);
    };
  }, [levelId, world, isDaily]);

  useEffect(() => {
    const timer = clock.current!;
    if (active) {
      timer.start();
      return;
    }
    timer.stop();
    // Saved on every stop, so time survives the app being closed from the background
    if (!isDaily && !finished.current) usePlayStats.getState().saveAttempt(levelId, timer.elapsedMs());
  }, [active, isDaily, levelId]);

  /** Records the win and returns the active seconds it took. */
  const finish = useCallback(
    (hints: number, firstWin: boolean): number => {
      const timer = clock.current!;
      finished.current = true;
      timer.stop();
      const seconds = Math.round(timer.elapsedMs() / 1000);
      if (!isDaily) usePlayStats.getState().won(levelId, { seconds, hints, first: firstWin, resized });
      return seconds;
    },
    [isDaily, levelId, resized],
  );

  const restart = useCallback(() => {
    clock.current!.reset();
    if (!isDaily) usePlayStats.getState().saveAttempt(levelId, 0);
  }, [isDaily, levelId]);

  const elapsedMs = useCallback(() => clock.current!.elapsedMs(), []);

  return { finish, restart, elapsedMs };
}
