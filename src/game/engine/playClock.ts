/**
 * Counts only the time a level is really being played. The screen stops it while paused,
 * in the background, behind another screen, or once the last word is found.
 */
export class PlayClock {
  private runningSince: number | null = null;

  constructor(private stoppedMs = 0) {}

  start(now = Date.now()): void {
    if (this.runningSince === null) this.runningSince = now;
  }

  stop(now = Date.now()): void {
    if (this.runningSince === null) return;
    this.stoppedMs += now - this.runningSince;
    this.runningSince = null;
  }

  elapsedMs(now = Date.now()): number {
    return this.stoppedMs + (this.runningSince === null ? 0 : now - this.runningSince);
  }

  /** Pause menu "Restart": a fresh attempt starts from zero */
  reset(now = Date.now()): void {
    this.stoppedMs = 0;
    if (this.runningSince !== null) this.runningSince = now;
  }
}
