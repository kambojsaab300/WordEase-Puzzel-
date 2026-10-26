/**
 * Builds coloured country outlines for the 3D globe from Natural Earth 1:10m
 * admin-0 countries (public domain), in two points of view:
 *  - src/map/countries.default.json  (Natural Earth default view)
 *  - src/map/countries.ind.json      (Natural Earth "India" point of view: Jammu & Kashmir,
 *                                     Ladakh incl. Aksai Chin, and Arunachal Pradesh in India)
 * The India view is checked below; the build fails if those areas are not inside India.
 * Source files go in tools/.cache (see tools/README or this script's download notes).
 * Run: npx tsx tools/build-countries.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import * as shapefile from 'shapefile';
import { WORLDS } from '../src/game/levels/worlds';

type Pt = [number, number];
type Feature = { iso: string; color: number; polygons: Pt[][] };

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'tools', '.cache');
const SIMPLIFY_DEG = 0.3;
const MAX_EDGE_DEG = 3;
const MIN_AREA = 0.8; // square degrees; smaller islands are dropped (the country keeps its largest part)

// Places that must be inside India in the India view
const INDIA_CHECKS: Record<string, Pt> = {
  'Gilgit (Gilgit-Baltistan)': [74.31, 35.92],
  'Aksai Chin': [79.2, 35.2],
  Srinagar: [74.8, 34.08],
  'Leh (Ladakh)': [77.58, 34.15],
  'Tawang (Arunachal Pradesh)': [91.86, 27.59],
  Delhi: [77.2, 28.6],
};

function inRing(ring: Pt[], [x, y]: Pt): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function area(ring: Pt[]): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}

function perpDistance(p: Pt, a: Pt, b: Pt): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

function densify(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    out.push(a);
    const steps = Math.floor(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / MAX_EDGE_DEG);
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

async function readCountries(base: string): Promise<Feature[]> {
  const source = await shapefile.open(path.join(CACHE, `${base}.shp`), path.join(CACHE, `${base}.dbf`));
  const out: Feature[] = [];
  for (let r = await source.read(); !r.done; r = await source.read()) {
    const { geometry, properties } = r.value as { geometry: { type: string; coordinates: unknown } | null; properties: Record<string, unknown> };
    if (!geometry) continue;
    const polys = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates) as Pt[][][];
    out.push({
      iso: String(properties.ADM0_A3),
      color: Math.max(1, Math.min(7, Number(properties.MAPCOLOR7) || 1)) - 1,
      polygons: polys.map(p => p[0].slice(0, -1)),
    });
  }
  return out;
}

const flat = (ring: Pt[]) => ring.flatMap(([lon, lat]) => [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]);

function countryAt(features: Feature[], p: Pt): Feature {
  const hit = features.find(f => f.polygons.some(ring => inRing(ring, p)));
  if (hit) return hit;
  // Small islands (e.g. Santorini) may fall between outlines: take the nearest coast
  let best = features[0];
  let bestDist = Infinity;
  for (const f of features) {
    for (const ring of f.polygons) {
      for (const q of ring) {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d < bestDist) {
          bestDist = d;
          best = f;
        }
      }
    }
  }
  return best;
}

async function build(base: string, outName: string, mustBeIndia: boolean) {
  const features = await readCountries(base);

  if (mustBeIndia) {
    const wrong = Object.entries(INDIA_CHECKS).filter(([, p]) => countryAt(features, p).iso !== 'IND');
    if (wrong.length) throw new Error(`India view check failed for: ${wrong.map(([n]) => n).join(', ')}`);
    console.log(`India view OK: ${Object.keys(INDIA_CHECKS).join(', ')} are inside India`);
  }

  const colors: number[][][] = Array.from({ length: 7 }, () => []);
  const byIso = new Map<string, number[][]>();
  let points = 0;
  for (const f of features) {
    const largest = f.polygons.reduce((a, b) => (area(b) > area(a) ? b : a));
    const rings: number[][] = [];
    for (const poly of f.polygons) {
      if (poly !== largest && area(poly) < MIN_AREA) continue;
      const ring = densify(simplify(poly, SIMPLIFY_DEG));
      if (ring.length < 4) continue;
      rings.push(flat(ring));
      points += ring.length;
    }
    colors[f.color].push(...rings);
    byIso.set(f.iso, [...(byIso.get(f.iso) ?? []), ...rings]);
  }

  // The country each World Trip stop lies in, so the globe can raise it
  const worlds: Record<number, string> = {};
  for (const w of WORLDS) worlds[w.id] = countryAt(features, [w.geo.lon, w.geo.lat]).iso;
  const worldRings: Record<string, number[][]> = {};
  for (const iso of new Set(Object.values(worlds))) worldRings[iso] = byIso.get(iso) ?? [];

  const file = path.join(ROOT, 'src', 'map', outName);
  fs.writeFileSync(file, JSON.stringify({ colors, worlds, worldRings }));
  console.log(`${base}: ${features.length} countries, ${points} points -> ${path.relative(ROOT, file)} (${fs.statSync(file).size} bytes)`);
}

(async () => {
  await build('ne_10m_admin_0_countries', 'countries.default.json', false);
  await build('ne_10m_admin_0_countries_ind', 'countries.ind.json', true);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
