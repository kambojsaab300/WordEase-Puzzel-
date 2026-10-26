/**
 * Builds the 3D globe data from Natural Earth 1:110m land
 * (public domain, tools/.cache/ne_110m_land.geojson):
 *  - src/map/land110.json: coastline rings, each a flat [lon, lat, lon, lat, ...] array
 *  - src/map/climate110.json: the same land cut into climate bands (ice, boreal, temperate,
 *    dry, tropical) so the globe can be coloured without drawing any country borders
 * Run: npx tsx tools/build-land.ts
 */
import fs from 'node:fs';
import path from 'node:path';

type Pt = [number, number];

const ROOT = path.resolve(__dirname, '..');
const SIMPLIFY_DEG = 0.15;
const MAX_EDGE_DEG = 3; // long edges are split so they bend with the sphere
const MIN_RING_POINTS = 4;

function perpDistance(p: Pt, a: Pt, b: Pt): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

// Douglas-Peucker
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
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
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

// Latitude bands by absolute latitude; index = colour slot on the globe
export const CLIMATE_BANDS: [number, number][] = [
  [64, 90], // ice
  [50, 64], // boreal forest
  [32, 50], // temperate
  [16, 32], // dry belt (Sahara, Arabia, inland Australia)
  [0, 16], // tropics
];

// Sutherland-Hodgman clip of a ring against minLat <= lat <= maxLat
function clipLat(points: Pt[], minLat: number, maxLat: number): Pt[] {
  const clipEdge = (pts: Pt[], inside: (p: Pt) => boolean, edgeLat: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const crossing = (): Pt => {
        const t = (edgeLat - prev[1]) / (cur[1] - prev[1]);
        return [prev[0] + (cur[0] - prev[0]) * t, edgeLat];
      };
      if (inside(cur)) {
        if (!inside(prev)) out.push(crossing());
        out.push(cur);
      } else if (inside(prev)) {
        out.push(crossing());
      }
    }
    return out;
  };
  const below = clipEdge(points, p => p[1] <= maxLat, maxLat);
  return clipEdge(below, p => p[1] >= minLat, minLat);
}

const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', '.cache', 'ne_110m_land.geojson'), 'utf8'));
const rings: number[][] = [];
let pointCount = 0;

for (const feature of geo.features) {
  const g = feature.geometry;
  const polygons: Pt[][][] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const polygon of polygons) {
    const outer = polygon[0].slice(0, -1); // GeoJSON repeats the first point at the end
    const ring = densify(simplify(outer, SIMPLIFY_DEG));
    if (ring.length < MIN_RING_POINTS) continue;
    rings.push(ring.flatMap(([lon, lat]) => [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]));
    pointCount += ring.length;
  }
}

const flat = (ring: Pt[]) => ring.flatMap(([lon, lat]) => [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]);

const out = path.join(ROOT, 'src', 'map', 'land110.json');
fs.writeFileSync(out, JSON.stringify(rings));
console.log(`${rings.length} rings, ${pointCount} points -> ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);

// Climate bands: clip each simplified coastline to the band, both hemispheres, then densify
const bands: number[][][] = CLIMATE_BANDS.map(() => []);
for (const flatRing of rings) {
  const ring: Pt[] = [];
  for (let i = 0; i < flatRing.length; i += 2) ring.push([flatRing[i], flatRing[i + 1]]);
  CLIMATE_BANDS.forEach(([lo, hi], band) => {
    for (const [min, max] of [[lo, hi], [-hi, -lo]]) {
      const clipped = clipLat(ring, min, max);
      if (clipped.length >= 3) bands[band].push(flat(densify(clipped)));
    }
  });
}
const climateOut = path.join(ROOT, 'src', 'map', 'climate110.json');
fs.writeFileSync(climateOut, JSON.stringify(bands));
console.log(
  `climate bands: ${bands.map(b => b.length).join('/')} rings -> ${path.relative(ROOT, climateOut)} (${fs.statSync(climateOut).size} bytes)`,
);
