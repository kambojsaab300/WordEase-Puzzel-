import { createMMKV, MMKV } from 'react-native-mmkv';
import { createJSONStorage, StateStorage } from 'zustand/middleware';

// Bump when a saved shape changes, and add a step to that store's migrate()
export const SCHEMA_VERSION = 1;

// Two instances as in the flow: game progress, and settings
const progressMMKV = createMMKV({ id: 'progress', recoveryStrategy: 'recover-on-error' });
const settingsMMKV = createMMKV({ id: 'settings', recoveryStrategy: 'recover-on-error' });

function toStateStorage(mmkv: MMKV): StateStorage {
  return {
    getItem: name => {
      const value = mmkv.getString(name) ?? null;
      if (value === null) return null;
      try {
        JSON.parse(value);
        return value;
      } catch {
        // A broken save must never crash the app; start fresh for this key
        mmkv.remove(name);
        return null;
      }
    },
    setItem: (name, value) => mmkv.set(name, value),
    removeItem: name => {
      mmkv.remove(name);
    },
  };
}

export const progressStorage = createJSONStorage(() => toStateStorage(progressMMKV));
export const settingsStorage = createJSONStorage(() => toStateStorage(settingsMMKV));
