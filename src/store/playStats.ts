import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { progressStorage, SCHEMA_VERSION } from './storage';

/** How one level went on this phone. Never leaves the phone unless the player shares it. */
export type LevelPlay = {
  /** Times the level screen was opened (a resume counts again) */
  opens: number;
  /** Times the player left before finishing */
  quits: number;
  wins: number;
  /**
   * The first win only: a replay is faster because the grid is already known.
   * `resized` marks a Huge-text win on a smaller re-made grid, which the bot never timed.
   */
  firstWin?: { seconds: number; hints: number; resized: boolean };
};

type PlayStatsData = {
  levels: Record<number, LevelPlay>;
  /** Active time of the level being played, so leaving and coming back keeps counting */
  attempt?: { levelId: number; ms: number };
};

type PlayStatsState = PlayStatsData & {
  opened: (levelId: number) => void;
  saveAttempt: (levelId: number, ms: number) => void;
  quit: (levelId: number, ms: number) => void;
  won: (levelId: number, win: { seconds: number; hints: number; first: boolean; resized: boolean }) => void;
  clear: () => void;
};

const EMPTY: LevelPlay = { opens: 0, quits: 0, wins: 0 };
const INITIAL: PlayStatsData = { levels: {}, attempt: undefined };

/** Milliseconds already played on this level's open attempt. */
export function attemptMs(levelId: number): number {
  const { attempt } = usePlayStats.getState();
  return attempt?.levelId === levelId ? attempt.ms : 0;
}

export const usePlayStats = create<PlayStatsState>()(
  persist(
    (set, get) => {
      const update = (levelId: number, change: (play: LevelPlay) => LevelPlay) =>
        set(s => ({ levels: { ...s.levels, [levelId]: change(s.levels[levelId] ?? EMPTY) } }));

      return {
        ...INITIAL,
        opened: levelId => {
          update(levelId, p => ({ ...p, opens: p.opens + 1 }));
          // Opening another level drops the old attempt, the same way its found words are dropped
          if (get().attempt?.levelId !== levelId) set({ attempt: { levelId, ms: 0 } });
        },
        saveAttempt: (levelId, ms) => set({ attempt: { levelId, ms } }),
        quit: (levelId, ms) => {
          update(levelId, p => ({ ...p, quits: p.quits + 1 }));
          set({ attempt: { levelId, ms } });
        },
        won: (levelId, { seconds, hints, first, resized }) => {
          update(levelId, p => ({
            ...p,
            wins: p.wins + 1,
            firstWin: first && !p.firstWin ? { seconds, hints, resized } : p.firstWin,
          }));
          set({ attempt: undefined });
        },
        clear: () => set(INITIAL),
      };
    },
    {
      name: 'playStats',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: ({ levels, attempt }) => ({ levels, attempt }),
      migrate: saved => ({ ...INITIAL, ...(saved as Partial<PlayStatsData>) }),
    },
  ),
);
