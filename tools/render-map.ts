/**
 * World map preview without a phone: projects the app's country data and World Trip
 * stops with the app's own projection and writes them as JSON for tools/render-map.py.
 * Run: npx tsx tools/render-map.ts <out.json> [ind|default] [width]
 */
import fs from 'node:fs';
import { WORLDS } from '../src/game/levels/worlds';
import { BorderView, loadCountries } from '../src/map/borderView';
import { MAP_ASPECT, toMap } from '../src/map/projection';

const out = process.argv[2] ?? 'map-preview.json';
const view = (process.argv[3] ?? 'ind') as BorderView;
const width = Number(process.argv[4] ?? 1200);
const data = loadCountries(view);

const project = (ring: number[]) => {
  const pts: number[][] = [];
  for (let i = 0; i < ring.length; i += 2) pts.push(toMap(ring[i], ring[i + 1], width));
  return pts;
};
const outline: number[][] = [];
for (let lat = -90; lat <= 90; lat += 3) outline.push(toMap(180, lat, width));
for (let lat = 90; lat >= -90; lat -= 3) outline.push(toMap(-180, lat, width));

fs.writeFileSync(
  out,
  JSON.stringify({
    width,
    height: width / MAP_ASPECT,
    outline,
    groups: data.colors.map(g => g.map(project)),
    pins: WORLDS.map(w => ({ id: w.id, at: toMap(w.geo.lon, w.geo.lat, width) })),
  }),
);
console.log(`wrote ${out}`);
