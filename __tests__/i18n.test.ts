import fs from 'node:fs';
import path from 'node:path';
import { DICTIONARIES, localeOf, SUPPORTED_LANGUAGES, t, translate, TKey } from '../src/i18n';
import { useSettings } from '../src/store/settings';

const en = DICTIONARIES.en as Record<string, string>;
const keys = Object.keys(en).sort();
const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe('dictionaries', () => {
  test('six UI languages, as in the flow', () => {
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toEqual(['en', 'es', 'pt', 'de', 'fr', 'hi']);
  });

  test.each(SUPPORTED_LANGUAGES.map(l => l.code))('%s has exactly the English keys', lang => {
    expect(Object.keys(DICTIONARIES[lang]).sort()).toEqual(keys);
  });

  test.each(SUPPORTED_LANGUAGES.map(l => l.code))('%s keeps every {placeholder} and has no empty text', lang => {
    const dict = DICTIONARIES[lang] as Record<string, string>;
    const problems = keys.filter(k => !dict[k]?.trim() || placeholders(dict[k]).join() !== placeholders(en[k]).join());
    expect(problems).toEqual([]);
  });

  test.each(SUPPORTED_LANGUAGES.map(l => l.code))('%s has 7 weekday letters and all 20 world names', lang => {
    expect(translate(lang, 'daily.weekdays').split(',')).toHaveLength(7);
    for (let id = 1; id <= 20; id++) expect(translate(lang, `world.${id}` as TKey)).not.toMatch(/^world\./);
  });

  test('each language has a locale for dates', () => {
    expect(localeOf('hi')).toBe('hi-IN');
    expect(localeOf('pt')).toBe('pt-BR');
    expect(localeOf('xx')).toBe('en-US');
  });
});

describe('translate', () => {
  test('fills placeholders', () => {
    expect(translate('en', 'map.play', { n: 12 })).toBe('Play 12');
    expect(translate('es', 'common.level', { n: 3 })).toBe('Nivel 3');
    expect(translate('hi', 'album.count', { n: 2, total: 20 })).toBe('मिली मुहरें: 20 में से 2');
  });

  test('same word in other languages', () => {
    expect(translate('de', 'settings.title')).toBe('Einstellungen');
    expect(translate('fr', 'common.continue')).toBe('Continuer');
    expect(translate('pt', 'app.tagline')).toBe('Caça-Palavras');
  });

  test('unknown language falls back to English (negative)', () => {
    expect(translate('xx', 'common.continue')).toBe('Continue');
    expect(translate('', 'map.daily')).toBe('Daily Postcard');
  });

  test('a missing parameter is left visible, never "undefined" (negative)', () => {
    expect(translate('en', 'map.play')).toBe('Play {n}');
    expect(translate('en', 'map.play', { other: 1 })).toBe('Play {n}');
  });

  test('t() follows the language chosen in Settings', () => {
    useSettings.setState({ lang: 'fr' });
    expect(t('settings.title')).toBe('Réglages');
    useSettings.setState({ lang: 'en' });
    expect(t('settings.title')).toBe('Settings');
  });
});

describe('no hard-coded UI text left in screens', () => {
  const dirs = ['src/screens', 'src/ui', 'src/map'].map(d => path.join(__dirname, '..', d));
  const files = dirs.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.tsx')).map(f => path.join(d, f)));
  // License texts stay in English on purpose; the app name is a brand.
  // Play data is a hidden developer screen (long-press on About), never shown to players.
  const allowedFiles = ['AboutScreen.tsx', 'PlayStatsScreen.tsx'];
  const allowedText = /^(WordEase|\?|✓|★)$/;

  test('JSX text and text props are all translated', () => {
    const problems: string[] = [];
    for (const file of files) {
      if (allowedFiles.includes(path.basename(file))) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const m of source.matchAll(/>\s*([^<>{}\n]*[A-Za-z]{2,}[^<>{}\n]*)\s*</g)) {
        if (!allowedText.test(m[1].trim())) problems.push(`${path.basename(file)}: text "${m[1].trim()}"`);
      }
      for (const m of source.matchAll(/\b(label|title|buttonLabel|accessibilityLabel|accessibilityHint|lockedHint)="([^"]*[A-Za-z]{2,}[^"]*)"/g)) {
        problems.push(`${path.basename(file)}: ${m[1]}="${m[2]}"`);
      }
    }
    expect(problems).toEqual([]);
  });
});
