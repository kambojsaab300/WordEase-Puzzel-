import { WORLDS } from '../src/game/levels/worlds';
import { appendLand, DEG, PathSink, prepareRings } from '../src/map/globeMath';

const BANDS: number[][][] = require('../src/map/climate110.json');
const LAND: number[][] = require('../src/map/land110.json');
// Same table as tools/build-land.ts: [min |lat|, max |lat|]
const LIMITS: [number, number][] = [
  [64, 90],
  [50, 64],
  [32, 50],
  [16, 32],
  [0, 16],
];

function inRing(ring: number[], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
    if (yi > lat !== yj > lat && ((xj - xi) * (lat - yi)) / (yj - yi) + xi > lon) inside = !inside;
  }
  return inside;
}
const bandsAt = (lon: number, lat: number) =>
  BANDS.map((rings, b) => (rings.some(r => inRing(r, lon, lat)) ? b : -1)).filter(b => b >= 0);
const onLand = (lon: number, lat: number) => LAND.some(r => inRing(r, lon, lat));

describe('climate colouring of the globe', () => {
  test('five bands, all with land in them', () => {
    expect(BANDS).toHaveLength(5);
    for (const band of BANDS) expect(band.length).toBeGreaterThan(5);
  });

  test('every ring stays inside its latitude band', () => {
    BANDS.forEach((rings, b) => {
      const [lo, hi] = LIMITS[b];
      for (const ring of rings) {
        for (let i = 1; i < ring.length; i += 2) {
          const a = Math.abs(ring[i]);
          expect(a).toBeGreaterThanOrEqual(lo - 0.11);
          expect(a).toBeLessThanOrEqual(hi + 0.11);
        }
      }
    });
  });

  test('each world on land gets exactly one band, the one its latitude says', () => {
    const problems: string[] = [];
    for (const w of WORLDS) {
      const { lon, lat } = w.geo;
      if (!onLand(lon, lat)) continue; // small islands sit just off the 1:110m coast
      const found = bandsAt(lon, lat);
      const expected = LIMITS.findIndex(([lo, hi]) => Math.abs(lat) >= lo && Math.abs(lat) < hi);
      if (found.length !== 1 || found[0] !== expected) problems.push(`${w.name}: ${found} vs ${expected}`);
    }
    expect(problems).toEqual([]);
  });

  test('known places get the expected colours', () => {
    expect(bandsAt(2.35, 48.86)).toEqual([2]); // Paris: temperate
    expect(bandsAt(25, 25)).toEqual([3]); // Sahara: dry
    expect(bandsAt(-60, -3.1)).toEqual([4]); // Amazon: tropics
    expect(bandsAt(0, -80)).toEqual([0]); // Antarctica: ice
  });

  test('open ocean is never coloured as land (negative)', () => {
    expect(bandsAt(-140, -20)).toEqual([]);
    expect(bandsAt(-30, 40)).toEqual([]);
  });

  test('each band draws only inside the globe circle', () => {
    const v = { yaw: 20 * DEG, pitch: 30 * DEG, r: 120, cx: 150, cy: 150 };
    for (const band of BANDS) {
      const pts: [number, number][] = [];
      const sink: PathSink = {
        moveTo: (x, y) => pts.push([x, y]),
        lineTo: (x, y) => pts.push([x, y]),
        close: () => {},
      };
      appendLand(sink, prepareRings(band), v);
      expect(pts.every(([x, y]) => Math.hypot(x - v.cx, y - v.cy) <= v.r + 1e-6)).toBe(true);
    }
  });
});
