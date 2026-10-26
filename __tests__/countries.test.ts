import { WORLDS } from '../src/game/levels/worlds';
import { borderViewFor, CountryData, loadCountries, regionOf } from '../src/map/borderView';
import { appendLand, DEG, PathSink, prepareRings } from '../src/map/globeMath';

const IND = loadCountries('ind');
const DEFAULT = loadCountries('default');

function inRing(ring: number[], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
    if (yi > lat !== yj > lat && ((xj - xi) * (lat - yi)) / (yj - yi) + xi > lon) inside = !inside;
  }
  return inside;
}
const inIndia = (data: CountryData, [lon, lat]: [number, number]) =>
  (data.worldRings.IND ?? []).some(r => inRing(r, lon, lat));

describe('India point of view', () => {
  const places: Record<string, [number, number]> = {
    'Gilgit (Gilgit-Baltistan)': [74.31, 35.92],
    'Aksai Chin': [79.2, 35.2],
    Srinagar: [74.8, 34.08],
    'Leh (Ladakh)': [77.58, 34.15],
    'Tawang (Arunachal Pradesh)': [91.86, 27.59],
    Delhi: [77.2, 28.6],
  };

  test.each(Object.entries(places))('%s is inside India', (_name, p) => {
    expect(inIndia(IND, p)).toBe(true);
  });

  test('the default view differs: Aksai Chin is not drawn inside India there (negative)', () => {
    expect(inIndia(DEFAULT, places['Aksai Chin'])).toBe(false);
  });
});

describe('choosing the view', () => {
  test.each([
    ['en-IN', 'IN'],
    ['hi_IN', 'IN'],
    ['en-Latn-IN', 'IN'],
    ['en-US', 'US'],
    ['de', ''],
    ['', ''],
  ])('region of %p is %p', (locale, region) => {
    expect(regionOf(locale)).toBe(region);
  });

  test('India region or Hindi UI gets the India view', () => {
    expect(borderViewFor('en', 'en-IN')).toBe('ind');
    expect(borderViewFor('hi', 'en-US')).toBe('ind');
    expect(borderViewFor('hi', '')).toBe('ind');
  });

  test('everyone else gets the default view (negative)', () => {
    expect(borderViewFor('en', 'en-US')).toBe('default');
    expect(borderViewFor('de', 'de-DE')).toBe('default');
    expect(borderViewFor('en', '')).toBe('default');
  });
});

describe('country data', () => {
  test.each([
    ['ind', IND],
    ['default', DEFAULT],
  ] as const)('%s: 7 colour groups of well-formed outlines', (_v, data) => {
    expect(data.colors).toHaveLength(7);
    let rings = 0;
    for (const group of data.colors) {
      for (const ring of group) {
        rings += 1;
        expect(ring.length % 2).toBe(0);
        expect(ring.length).toBeGreaterThanOrEqual(8);
        for (let i = 0; i < ring.length; i += 2) {
          expect(Math.abs(ring[i])).toBeLessThanOrEqual(180);
          expect(Math.abs(ring[i + 1])).toBeLessThanOrEqual(90);
        }
      }
    }
    expect(rings).toBeGreaterThan(150);
  });

  test('every World Trip stop sits in the right country, in both views', () => {
    const expected = ['IRL', 'FRA', 'ITA', 'GRC', 'EGY', 'KEN', 'IND', 'THA', 'JPN', 'CHN', 'AUS', 'USA', 'MEX', 'PER', 'BRA', 'CAN', 'USA', 'ISL', 'GBR', 'ATA'];
    for (const data of [IND, DEFAULT]) {
      expect(WORLDS.map(w => data.worlds[String(w.id)])).toEqual(expected);
      for (const iso of expected) expect(data.worldRings[iso]?.length).toBeGreaterThan(0);
    }
  });

  test('countries draw only inside the globe circle', () => {
    const v = { yaw: 78 * DEG, pitch: 25 * DEG, r: 140, cx: 160, cy: 160 };
    for (const group of IND.colors) {
      const pts: [number, number][] = [];
      const sink: PathSink = {
        moveTo: (x, y) => pts.push([x, y]),
        lineTo: (x, y) => pts.push([x, y]),
        close: () => {},
      };
      appendLand(sink, prepareRings(group), v);
      expect(pts.every(([x, y]) => Math.hypot(x - v.cx, y - v.cy) <= v.r + 1e-6)).toBe(true);
    }
  });
});
