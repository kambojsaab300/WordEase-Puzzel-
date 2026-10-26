import { WORLDS } from '../src/game/levels/worlds';
import { loadCountries } from '../src/map/borderView';
import {
  clampCamera,
  FOCUS_ZOOM,
  focusCamera,
  homeCamera,
  MAP_MAX_ZOOM,
  onScreen,
  pinchCamera,
} from '../src/map/mapZoom';
import { equalEarth, MAP_ASPECT, MAP_X, MAP_Y, ringsToSvg, routeSvg, toMap } from '../src/map/projection';
import { unlockedWorldOf, worldStats, worldStatuses } from '../src/map/worldProgress';

describe('Equal Earth projection', () => {
  test('the centre of the map is lon 0, lat 0', () => {
    const [x, y] = equalEarth(0, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  test('the edges are the date line and the poles', () => {
    expect(equalEarth(180, 0)[0]).toBeCloseTo(MAP_X, 3);
    expect(equalEarth(0, 90)[1]).toBeCloseTo(MAP_Y, 3);
    expect(equalEarth(-180, -90)[1]).toBeCloseTo(-MAP_Y, 3);
  });

  test('east is right and north is up on the screen map', () => {
    const [x0, y0] = toMap(0, 0, 1000);
    expect(toMap(10, 0, 1000)[0]).toBeGreaterThan(x0);
    expect(toMap(0, 10, 1000)[1]).toBeLessThan(y0);
  });

  test('every place lands inside the map box', () => {
    const w = 1000;
    const h = w / MAP_ASPECT;
    for (let lon = -180; lon <= 180; lon += 15) {
      for (let lat = -90; lat <= 90; lat += 15) {
        const [x, y] = toMap(lon, lat, w);
        expect(x).toBeGreaterThanOrEqual(-1e-6);
        expect(x).toBeLessThanOrEqual(w + 1e-6);
        expect(y).toBeGreaterThanOrEqual(-1e-6);
        expect(y).toBeLessThanOrEqual(h + 1e-6);
      }
    }
  });

  test('paths: one closed shape per ring; a route needs at least two stops', () => {
    expect(ringsToSvg([[0, 0, 10, 0, 10, 10], [20, 20, 30, 20, 30, 30]], 500).match(/Z/g)).toHaveLength(2);
    expect(routeSvg([[1, 1]])).toBe('');
    expect(routeSvg([[0, 0], [10, 0]])).toMatch(/^M0\.0 0\.0Q/);
  });
});

describe('map data on the flat map', () => {
  test('no country edge jumps across the whole map at the date line', () => {
    for (const view of ['ind', 'default'] as const) {
      for (const group of loadCountries(view).colors) {
        for (const ring of group) {
          for (let i = 0; i < ring.length; i += 2) {
            const j = (i + 2) % ring.length;
            expect(Math.abs(ring[i] - ring[j])).toBeLessThanOrEqual(180);
          }
        }
      }
    }
  });

  test('every world sits on land, or right by the coast for small islands', () => {
    const rings = loadCountries('ind').colors.flat();
    const inRing = (r: number[], lon: number, lat: number) => {
      let inside = false;
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        if (r[i + 1] > lat !== r[j + 1] > lat && lon < ((r[j] - r[i]) * (lat - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) {
          inside = !inside;
        }
      }
      return inside;
    };
    const byCoast = (lon: number, lat: number) =>
      rings.some(r => {
        for (let i = 0; i < r.length; i += 2) if (Math.hypot(r[i] - lon, r[i + 1] - lat) < 3) return true;
        return false;
      });
    const misplaced = WORLDS.filter(w => !rings.some(r => inRing(r, w.geo.lon, w.geo.lat)) && !byCoast(w.geo.lon, w.geo.lat));
    expect(misplaced.map(w => w.name)).toEqual([]);
  });
});

describe('map camera', () => {
  const box = { viewW: 360, viewH: 400, mapW: 360, mapH: 360 / MAP_ASPECT };

  test('the whole map shows first, centred vertically', () => {
    const c = homeCamera(box);
    expect(c.scale).toBe(1);
    expect(c.tx).toBe(0);
    expect(c.ty).toBeCloseTo((box.viewH - box.mapH) / 2);
  });

  test('choosing a world zooms in with it in the middle', () => {
    const [px, py] = toMap(78, 22, box.mapW); // India
    const c = focusCamera(px, py, FOCUS_ZOOM, box);
    const p = onScreen(px, py, c);
    expect(c.scale).toBe(FOCUS_ZOOM);
    expect(p.x).toBeCloseTo(box.viewW / 2);
  });

  test('near an edge the camera stops at the map border instead of showing empty space (negative)', () => {
    const [px, py] = toMap(-175, 70, box.mapW); // far top-left
    const c = focusCamera(px, py, FOCUS_ZOOM, box);
    expect(c.tx).toBe(0); // left edge of the map stays at the left of the view
  });

  test('pinch keeps the place under the fingers, within the zoom limits', () => {
    const start = homeCamera(box);
    const focal = { x: 200, y: 200 };
    const c = pinchCamera(start, focal, 2, focal, box);
    const before = { x: (focal.x - start.tx) / start.scale, y: (focal.y - start.ty) / start.scale };
    const now = onScreen(before.x, before.y, c);
    expect(now.x).toBeCloseTo(focal.x);
    expect(pinchCamera(start, focal, 100, focal, box).scale).toBe(MAP_MAX_ZOOM);
    expect(pinchCamera(start, focal, 0.1, focal, box).scale).toBe(1);
  });

  test('dragging too far is stopped at the map edge (negative)', () => {
    const c = clampCamera({ scale: 3, tx: 900, ty: -9999 }, box);
    expect(c.tx).toBe(0);
    expect(c.ty).toBeCloseTo(box.viewH - box.mapH * 3);
    // while the zoomed map is still shorter than the view, it stays centred
    expect(clampCamera({ scale: 2, tx: 0, ty: -9999 }, box).ty).toBeCloseTo((box.viewH - box.mapH * 2) / 2);
  });
});

describe('world progress on the map', () => {
  test('a new player: world 1 is current, the rest locked', () => {
    const s = worldStatuses(1, {});
    expect(s[0]).toBe('current');
    expect(s.slice(1).every(x => x === 'locked')).toBe(true);
  });

  test('after finishing world 1, it is done and world 2 is current', () => {
    const stars: Record<number, number> = {};
    for (let id = 1; id <= 60; id++) stars[id] = 3;
    const s = worldStatuses(61, stars);
    expect(s.slice(0, 3)).toEqual(['done', 'current', 'locked']);
    expect(worldStats(1, stars)).toEqual({ levelsDone: 60, stars: 180, total: 60 });
  });

  test('odd progress values never break the unlocked world (negative)', () => {
    expect(unlockedWorldOf(0)).toBe(1);
    expect(unlockedWorldOf(-10)).toBe(1);
    expect(unlockedWorldOf(99999)).toBe(20);
  });
});
