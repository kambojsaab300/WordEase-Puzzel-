import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HintMark } from '../game/engine/hints';
import { LevelReward, levelReward } from '../game/engine/rewards';
import type { Stars } from '../game/engine/scoring';
import { progressStorage, SCHEMA_VERSION } from './storage';
import { useWallet } from './wallet';

export type InProgress = {
  levelId: number;
  found: string[];
  bonusFound: string[];
  hints: HintMark[];
};

type ProgressData = {
  currentLevel: number; // highest unlocked level
  stars: Record<number, Stars>;
  inProgress?: InProgress;
  lastSeenWorld: number; // for the cloud unlock animation on the globe
};

type ProgressState = ProgressData & {
  saveInProgress: (state: InProgress) => void;
  completeLevel: (levelId: number, stars: Stars) => LevelReward;
  markWorldSeen: (world: number) => void;
};

const INITIAL: ProgressData = {
  currentLevel: 1,
  stars: {},
  inProgress: undefined,
  lastSeenWorld: 1,
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      saveInProgress: inProgress => set({ inProgress }),
      completeLevel: (levelId, stars) => {
        const reward = levelReward(levelId, stars, get().stars[levelId]);
        set(s => ({
          stars: { ...s.stars, [levelId]: reward.newBest },
          currentLevel: Math.max(s.currentLevel, levelId + 1),
          inProgress: undefined,
        }));
        if (reward.coins > 0) useWallet.getState().add(reward.coins);
        return reward;
      },
      markWorldSeen: world => set(s => ({ lastSeenWorld: Math.max(s.lastSeenWorld, world) })),
    }),
    {
      name: 'progress',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: ({ currentLevel, stars, inProgress, lastSeenWorld }) => ({
        currentLevel,
        stars,
        inProgress,
        lastSeenWorld,
      }),
      // Unknown or older saves keep whatever fields still make sense
      migrate: saved => ({ ...INITIAL, ...(saved as Partial<ProgressData>) }),
    },
  ),
);
