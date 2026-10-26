import { useCallback } from 'react';
import { useSettings } from '../store/settings';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import pt from './pt.json';

// UI language only: puzzle words and meanings stay in the puzzle language (English packs for now)
export type TKey = keyof typeof en;
export type Params = Record<string, string | number>;
export type Translate = (key: TKey, params?: Params) => string;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', locale: 'en-US' },
  { code: 'es', name: 'Español', locale: 'es-ES' },
  { code: 'pt', name: 'Português', locale: 'pt-BR' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE' },
  { code: 'fr', name: 'Français', locale: 'fr-FR' },
  { code: 'hi', name: 'हिन्दी (Hindi)', locale: 'hi-IN' },
] as const;

export type Lang = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DICTIONARIES: Record<Lang, Partial<Record<TKey, string>>> = { en, es, pt, de, fr, hi };

const isLang = (code: string): code is Lang => code in DICTIONARIES;

/** Text for `key` in `lang`, with {placeholders} filled; English if a text is missing. */
export function translate(lang: string, key: TKey, params?: Params): string {
  const dict = isLang(lang) ? DICTIONARIES[lang] : DICTIONARIES.en;
  const text = dict[key] ?? en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** For code outside React components (alerts, toasts built in callbacks). */
export function t(key: TKey, params?: Params): string {
  return translate(useSettings.getState().lang, key, params);
}

/** For components: re-renders when the player changes the language. */
export function useT(): Translate {
  const lang = useSettings(s => s.lang);
  return useCallback((key: TKey, params?: Params) => translate(lang, key, params), [lang]);
}

export function localeOf(lang: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.locale ?? 'en-US';
}

export const worldKey = (id: number) => `world.${id}` as TKey;
