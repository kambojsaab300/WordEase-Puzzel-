import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SCHEMA_VERSION, settingsStorage } from './storage';

export type InputMode = 'drag' | 'tap';

export type Settings = {
  textScale: 1 | 1.25 | 1.5;
  inputMode: InputMode;
  music: number;
  sfx: number;
  haptics: boolean;
  meanings: boolean;
  highContrast: boolean;
  colorBlind: boolean;
  reduceMotion: boolean;
  lang: string;
  onboarded: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  inputMode: 'drag',
  music: 0.5,
  sfx: 0.8,
  haptics: true,
  meanings: true,
  highContrast: false,
  colorBlind: false,
  reduceMotion: false,
  lang: 'en',
  onboarded: false,
};

type SettingsState = Settings & {
  update: (patch: Partial<Settings>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    set => ({
      ...DEFAULT_SETTINGS,
      update: patch => set(patch),
    }),
    {
      name: 'settings',
      storage: settingsStorage,
      version: SCHEMA_VERSION,
      // Keys added in later versions fall back to their defaults
      merge: (saved, current) => ({ ...current, ...(saved as Partial<Settings>) }),
    },
  ),
);
