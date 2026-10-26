import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STARTING_COINS } from '../game/engine/rewards';
import { progressStorage, SCHEMA_VERSION } from './storage';

type WalletState = {
  coins: number;
  adFree: boolean;
  add: (amount: number) => void;
  // Returns false (and spends nothing) when there are not enough coins
  spend: (amount: number) => boolean;
  setAdFree: (adFree: boolean) => void;
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      coins: STARTING_COINS,
      adFree: false,
      add: amount => set(s => ({ coins: s.coins + amount })),
      spend: amount => {
        if (get().coins < amount) return false;
        set(s => ({ coins: s.coins - amount }));
        return true;
      },
      setAdFree: adFree => set({ adFree }),
    }),
    {
      name: 'wallet',
      storage: progressStorage,
      version: SCHEMA_VERSION,
      partialize: s => ({ coins: s.coins, adFree: s.adFree }),
    },
  ),
);
