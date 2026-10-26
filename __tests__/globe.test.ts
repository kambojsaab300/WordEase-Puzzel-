import { WORLDS } from '../src/game/levels/worlds';
import {
  appendArc,
  appendGraticule,
  appendLand,
  clampPitch,
  DEG,
  MAX_PITCH,
  PathSink,
  prepareRings,
  project,
  shortestYaw,
  View,
} from '../src/map/globeMath';
import { unlockedWorldOf, worldStats, worldStatuses } from '../src/map/worldProgress';

const LAND: number[][] = require('../src/map/land110.json');
const RINGS = prepareRings(LAND);

const viewAt = (lon: number, lat: number, r = 100): View => ({
  yaw: lon * DEG,
  pitch: lat * DEG,
  r,
  cx: 200,
  cy: 300,
});

// Records what would be drawn instead of drawing it
function recorder() {
  const points: [number, number][] = [];
  let moves = 0;
  let closes = 0;
  const sink: PathSink = {
    moveTo: (x, y) => {
      moves += 1;
      points.push([x, y]);
    },
    lineTo: (x, y) => points.push([x, y]),
    close: () => {
      closes += 1;
    },
  };
  return { sink, points, counts: () => ({ moves, closes }) };
}

const insideGlobe = (points: [number, number][], v: View) =>
  points.every(([x, y]) => Math.hypot(x - v.cx, y - v.cy) <= v.r + 1e-6);

describe('orthographic projection', () => {
  test('the place the camera looks at sits in the middle, facing us', () => {
    const v = viewAt(2.35, 48.86);
    const p = project(2.35, 48.86, v);
    expect(p.x).toBeCloseTo(v.cx);
    expect(p.y).toBeCloseTo(v.cy);
    expect(p.visible).toBe(true);
    expect(p.depth).toBeCloseTo(1);
  });

  test('the opposite side of the Earth is hidden (negative)', () => {
    const p = project(180 + 2.35, -48.86, viewAt(2.35, 48.86));
    expect(p.visible).toBe(false);
    expect(p.depth).toBeCloseTo(-1);
  });

  test('90° east on the equator touches the right edge; the North Pole the top', () => {
    const v = viewAt(0, 0);
    const east = project(90, 0, v);
    expect(east.x).toBeCloseTo(v.cx + v.r);
    expect(east.depth).toBeCloseTo(0);
    const pole = project(0, 90, v);
    expect(pole.y).toBeCloseTo(v.cy - v.r);
  });

  test('north is up and east is right', () => {
    const v = viewAt(10, 45);
    expect(project(10, 50, v).y).toBeLessThan(v.cy);
    expect(project(15, 45, v).x).toBeGreaterThan(v.cx);
  });

  test('spinning the camera east moves places west on screen', () => {
    const before = project(2.35, 48.86, viewAt(0, 40));
    const after = project(2.35, 48.86, viewAt(10, 40));
    expect(after.x).toBeLessThan(before.x);
  });
});

describe('camera moves', () => {
  test('flies the short way round across the date line', () => {
    const from = 170 * DEG;
    const to = shortestYaw(from, -170);
    expect(to - from).toBeCloseTo(20 * DEG);
  });

  test('works after many full turns of spinning', () => {
    const from = (720 + 10) * DEG;
    const to = shortestYaw(from, 20);
    expect(to - from).toBeCloseTo(10 * DEG);
  });

  test('tilt never flips over the poles (negative)', () => {
    expect(clampPitch(3)).toBe(MAX_PITCH);
    expect(clampPitch(-3)).toBe(-MAX_PITCH);
    expect(clampPitch(0.5)).toBe(0.5);
  });
});

describe('drawing stays on the globe', () => {
  const views = [viewAt(0, 0), viewAt(2.35, 48.86), viewAt(138, 35), viewAt(-155, 20), viewAt(166, -77.8, 240)];

  test.each(views.map(v => [v.yaw / DEG, v.pitch / DEG, v]))('land at %f,%f: every point inside the circle', (_lon, _lat, v) => {
    const rec = recorder();
    appendLand(rec.sink, RINGS, v as View);
    expect(rec.points.length).toBeGreaterThan(50);
    expect(insideGlobe(rec.points, v as View)).toBe(true);
    const { moves, closes } = rec.counts();
    expect(moves).toBe(closes); // every coastline is closed
  });

  test('a ring entirely on the far side is not drawn at all', () => {
    // A small square around 0,0 seen from the opposite side of the Earth
    const ring = prepareRings([[-1, -1, 1, -1, 1, 1, -1, 1]]);
    const rec = recorder();
    appendLand(rec.sink, ring, viewAt(180, 0));
    expect(rec.points).toEqual([]);
  });

  test('grid lines and flight routes stay inside the circle', () => {
    const v = viewAt(20, 30);
    const grid = recorder();
    appendGraticule(grid.sink, v);
    expect(grid.points.length).toBeGreaterThan(100);
    expect(insideGlobe(grid.points, v)).toBe(true);

    const arc = recorder();
    appendArc(arc.sink, [2.35, 48.86], [12.5, 41.9], v);
    expect(insideGlobe(arc.points, v)).toBe(true);
    const paris = project(2.35, 48.86, v);
    expect(arc.points[0][0]).toBeCloseTo(paris.x);
    expect(arc.points[0][1]).toBeCloseTo(paris.y);
  });

  test('a route hidden behind the Earth draws nothing (negative)', () => {
    const rec = recorder();
    appendArc(rec.sink, [2.35, 48.86], [12.5, 41.9], viewAt(-170, -45));
    expect(rec.points).toEqual([]);
  });
});

describe('map data', () => {
  test('land outlines are well formed', () => {
    expect(LAND.length).toBeGreaterThan(100);
    for (const ring of LAND) {
      expect(ring.length % 2).toBe(0);
      expect(ring.length).toBeGreaterThanOrEqual(8);
      for (let i = 0; i < ring.length; i += 2) {
        expect(Math.abs(ring[i])).toBeLessThanOrEqual(180);
        expect(Math.abs(ring[i + 1])).toBeLessThanOrEqual(90);
      }
    }
  });

  test('every world sits on land, or right by the coast for small islands', () => {
    // Ray casting on each ring, treating lon/lat as flat coordinates
    const onLand = (lon: number, lat: number) =>
      LAND.some(ring => {
        let inside = false;
        for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
          const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
          if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      });
    const byCoast = (lon: number, lat: number) =>
      LAND.some(ring => {
        for (let i = 0; i < ring.length; i += 2) {
          if (Math.hypot(ring[i] - lon, ring[i + 1] - lat) < 2) return true;
        }
        return false;
      });
    const misplaced = WORLDS.filter(w => !onLand(w.geo.lon, w.geo.lat) && !byCoast(w.geo.lon, w.geo.lat));
    expect(misplaced.map(w => w.name)).toEqual([]);
  });

  test('the land check itself works: the middle of the Pacific is not land (negative)', () => {
    const sea = LAND.some(ring => {
      let inside = false;
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]];
        if (yi > -20 !== yj > -20 && ((xj - xi) * (-20 - yi)) / (yj - yi) + xi > -140) inside = !inside;
      }
      return inside;
    });
    expect(sea).toBe(false);
  });

  test('no two worlds share a spot', () => {
    const keys = WORLDS.map(w => `${w.geo.lat},${w.geo.lon}`);
    expect(new Set(keys).size).toBe(WORLDS.length);
  });
});

describe('world progress on the globe', () => {
  test('a new player: world 1 is current, the rest locked', () => {
    const s = worldStatuses(1, {});
    expect(s[0]).toBe('current');
    expect(s.slice(1).every(x => x === 'locked')).toBe(true);
  });

  test('after finishing world 1, it is done and world 2 is current', () => {
    const stars: Record<number, number> = {};
    for (let id = 1; id <= 60; id++) stars[id] = 3;
    const s = worldStatuses(61, stars);
    expect(s[0]).toBe('done');
    expect(s[1]).toBe('current');
    expect(s[2]).toBe('locked');
    expect(worldStats(1, stars)).toEqual({ levelsDone: 60, stars: 180, total: 60 });
    expect(worldStats(2, stars)).toEqual({ levelsDone: 0, stars: 0, total: 60 });
  });

  test('odd progress values never break the unlocked world (negative)', () => {
    expect(unlockedWorldOf(0)).toBe(1);
    expect(unlockedWorldOf(-10)).toBe(1);
    expect(unlockedWorldOf(99999)).toBe(20);
  });
});
