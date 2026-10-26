import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { progressStorage, SCHEMA_VERSION } from './storage';

export type AdStateData = {
  levelsSinceInterstitial: number;
  lastFullscreenAt: number;
  lastAppOpenAt: number;
  rewardedHintsToday: number;
  freeCoinsClaimedToday: number;
  dayKey: string;
};

type AdStateActions = {
  resetForTesting: () => void;
  recordInterstitialShown: (timeMs?: number) => void;
  incrementLevelsSinceAd: () => number;
  canClaimFreeCoins: (todayKey: string, cap: number) => boolean;
  recordFreeCoinsClaimed: (todayKey: string) => number;
  canWatchRewardedHint: (todayKey: string, cap: number) => boolean;
  recordRewardedHint: (todayKey: string) => void;
};

export const INITIAL_AD_STATE: AdStateData = {
  levelsSinceInterstitial: 0,
  lastFullscreenAt: 0,
  lastAppOpenAt: 0,
  rewardedHintsToday: 0,
  freeCoinsClaimedToday: 0,
  dayKey: '',
};

export const useAdState = create<AdStateData & AdStateActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_AD_STATE,

      resetForTesting: () => set({ ...INITIAL_AD_STATE }),

      recordInterstitialShown: (timeMs = Date.now()) =>
        set({ lastFullscreenAt: timeMs, levelsSinceInterstitial: 0 }),

      incrementLevelsSinceAd: () => {
        const next = get().levelsSinceInterstitial + 1;
        set({ levelsSinceInterstitial: next });
        return next;
      },

      canClaimFreeCoins: (todayKey, cap) => {
        const state = get();
        if (state.dayKey !== todayKey) {
          set({ dayKey: todayKey, freeCoinsClaimedToday: 0, rewardedHintsToday: 0 });
          return true;
        }
        return state.freeCoinsClaimedToday < cap;
      },

      recordFreeCoinsClaimed: todayKey => {
        const state = get();
        const base = state.dayKey === todayKey ? state.freeCoinsClaimedToday : 0;
        const next = base + 1;
        set({ dayKey: todayKey, freeCoinsClaimedToday: next });
        return next;
      },

      canWatchRewardedHint: (todayKey, cap) => {
        const state = get();
        if (state.dayKey !== todayKey) {
          set({ dayKey: todayKey, freeCoinsClaimedToday: 0, rewardedHintsToday: 0 });
          return true;
        }
        return state.rewardedHintsToday < cap;
      },

      recordRewardedHint: todayKey => {
        const state = get();
        const base = state.dayKey === todayKey ? state.rewardedHintsToday : 0;
        set({ dayKey: todayKey, rewardedHintsToday: base + 1 });
      },
    }),
    {
      name: 'adState',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      migrate: saved => ({ ...INITIAL_AD_STATE, ...(saved as Partial<AdStateData>) }),
    },
  ),
);
