// Which country boundaries the globe shows. Players in India (phone region IN, or the
// Hindi UI) get Natural Earth's India point of view, which shows Jammu & Kashmir,
// Ladakh (incl. Aksai Chin) and Arunachal Pradesh as part of India. Everyone else gets
// Natural Earth's default view. This mirrors how map apps adapt borders by region.
export type BorderView = 'ind' | 'default';

export type CountryData = {
  colors: number[][][]; // 7 colour groups (Natural Earth MAPCOLOR7: neighbours differ)
  worlds: Record<string, string>; // world id -> country code
  worldRings: Record<string, number[][]>; // country code -> outline rings
};

// "en-IN", "hi_IN", "en-Latn-IN" -> "IN"
export function regionOf(locale: string): string {
  const parts = locale.split(/[-_]/);
  for (let i = parts.length - 1; i > 0; i--) {
    if (/^[A-Za-z]{2}$/.test(parts[i])) return parts[i].toUpperCase();
  }
  return '';
}

export function borderViewFor(lang: string, locale: string): BorderView {
  return lang === 'hi' || regionOf(locale) === 'IN' ? 'ind' : 'default';
}

export function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? '';
  } catch {
    return '';
  }
}

export function loadCountries(view: BorderView): CountryData {
  return view === 'ind'
    ? (require('./countries.ind.json') as CountryData)
    : (require('./countries.default.json') as CountryData);
}
