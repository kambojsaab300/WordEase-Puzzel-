import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HintMark } from '../game/engine/hints';
import { LevelReward, levelReward, worldUnlockCost } from '../game/engine/rewards';
import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
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
  boughtWorlds: number[]; // countries opened early with coins
};

type ProgressState = ProgressData & {
  saveInProgress: (state: InProgress) => void;
  completeLevel: (levelId: number, stars: Stars) => LevelReward;
  markWorldSeen: (world: number) => void;
  // Spends the world's coin cost; false when already open or coins are short
  buyWorld: (world: number) => boolean;
};

const INITIAL: ProgressData = {
  currentLevel: 1,
  stars: {},
  inProgress: undefined,
  lastSeenWorld: 1,
  boughtWorlds: [],
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      saveInProgress: inProgress => set({ inProgress }),
      completeLevel: (levelId, stars) => {
        const reward = levelReward(levelId, stars, get().stars[levelId]);
        set(s => {
          const won = { ...s.stars, [levelId]: reward.newBest };
          // Levels won in a bought world don't move the main route; when the route catches up it skips them
          let currentLevel = levelId === s.currentLevel ? levelId + 1 : s.currentLevel;
          while (won[currentLevel]) currentLevel += 1;
          return { stars: won, currentLevel, inProgress: undefined };
        });
        if (reward.coins > 0) useWallet.getState().add(reward.coins);
        return reward;
      },
      markWorldSeen: world => set(s => ({ lastSeenWorld: Math.max(s.lastSeenWorld, world) })),
      buyWorld: world => {
        const { currentLevel, boughtWorlds } = get();
        if (boughtWorlds.includes(world) || currentLevel > (world - 1) * LEVELS_PER_WORLD) return false;
        if (!useWallet.getState().spend(worldUnlockCost(world))) return false;
        set({ boughtWorlds: [...boughtWorlds, world] });
        return true;
      },
    }),
    {
      name: 'progress',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: ({ currentLevel, stars, inProgress, lastSeenWorld, boughtWorlds }) => ({
        currentLevel,
        stars,
        inProgress,
        lastSeenWorld,
        boughtWorlds,
      }),
      // Unknown or older saves keep whatever fields still make sense
      migrate: saved => ({ ...INITIAL, ...(saved as Partial<ProgressData>) }),
    },
  ),
);
