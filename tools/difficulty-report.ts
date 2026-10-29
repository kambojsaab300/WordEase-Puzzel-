/**
 * Plays every shipped level with the search bot and shows whether the planned sawtooth is real.
 * Writes tools/.cache/difficulty.csv and tools/.cache/difficulty-report.html. Changes no level.
 * Run: npm run levels:difficulty
 */
import fs from 'node:fs';
import path from 'node:path';
import { estimateLevel } from '../src/game/difficulty/searchBot';
import { targetSeconds } from '../src/game/difficulty/target';
import {
  DIP_ROLES,
  LANDMARK_EVERY,
  LEVELS_PER_WORLD,
  levelInWorld,
  levelRole,
  levelSpec,
  Role,
} from '../src/game/levels/levelSpec';
import { LevelDef } from '../src/game/types';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'tools', '.cache');
const RUNS = 200;
// A rise this steep between two neighbours feels like a wall unless it is a planned peak
const SPIKE = 1.5;
// "On target" in the summary tile
const NEAR = 1.25;

type FlagKind = 'dip' | 'outranks-peak' | 'spike';
type Flag = { kind: FlagKind; note: string };

type Row = {
  id: number;
  world: number;
  inWorld: number;
  role: Role;
  size: number;
  words: number;
  stored: number;
  target: number;
  median: number;
  p90: number;
  hints: number;
  flags: Flag[];
};

const isPeak = (role: Role) => role === 'peak' || role === 'finale';

function loadLevels(): LevelDef[] {
  const dir = path.join(ROOT, 'assets', 'levels', 'en');
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as LevelDef[]);
}

function measure(levels: LevelDef[]): Row[] {
  return levels.map(level => {
    const est = estimateLevel(level, levelSpec(level.id).dirs, RUNS);
    return {
      id: level.id,
      world: level.world,
      inWorld: levelInWorld(level.id),
      role: levelRole(level.id),
      size: level.rows,
      words: level.words.length,
      stored: level.difficulty,
      target: targetSeconds(level.id),
      ...est,
      flags: [],
    };
  });
}

function addFlags(rows: Row[]): void {
  const byId = new Map(rows.map(r => [r.id, r]));
  let lastClimb: Row | undefined; // latest level that is not a planned dip

  for (const row of rows) {
    if (DIP_ROLES.includes(row.role)) {
      if (lastClimb && row.median >= lastClimb.median) {
        row.flags.push({ kind: 'dip', note: `${row.role} is not easier than level ${lastClimb.id}` });
      }
    } else {
      lastClimb = row;
      const peak = byId.get(Math.ceil(row.id / LANDMARK_EVERY) * LANDMARK_EVERY);
      if (!isPeak(row.role) && peak && row.median > peak.median) {
        row.flags.push({ kind: 'outranks-peak', note: `harder than landmark ${peak.id}` });
      }
    }
    const prev = byId.get(row.id - 1);
    if (!isPeak(row.role) && prev && row.median > prev.median * SPIKE) {
      const rise = Math.round((row.median / prev.median - 1) * 100);
      row.flags.push({ kind: 'spike', note: `+${rise}% jump from level ${prev.id}` });
    }
  }
}

/**
 * Average shape of a world: each level's time divided by its world's average, then averaged
 * over worlds. `pick` chooses the bot time or the target, so plan and result can be compared.
 */
function rhythmShape(rows: Row[], pick: (r: Row) => number): number[] {
  const worldMean = new Map<number, number>();
  for (const world of new Set(rows.map(r => r.world))) {
    worldMean.set(world, mean(rows.filter(r => r.world === world).map(pick)));
  }
  return Array.from({ length: LEVELS_PER_WORLD }, (_, i) =>
    mean(rows.filter(r => r.inWorld === i + 1).map(r => pick(r) / worldMean.get(r.world)!)),
  );
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

const sec = (x: number) => Math.round(x);
const flagCount = (rows: Row[], kind: FlagKind) => rows.filter(r => r.flags.some(f => f.kind === kind)).length;
const nearTarget = (rows: Row[]) => rows.filter(r => r.median <= r.target * NEAR && r.median >= r.target / NEAR).length;

function writeCsv(rows: Row[]): string {
  const header = 'level,world,level_in_world,role,size,words,stored_s,target_s,median_s,p90_s,hints,flags';
  const lines = rows.map(r =>
    [
      r.id,
      r.world,
      r.inWorld,
      r.role,
      r.size,
      r.words,
      r.stored,
      r.target.toFixed(1),
      r.median.toFixed(1),
      r.p90.toFixed(1),
      r.hints.toFixed(2),
      `"${r.flags.map(f => f.note).join('; ')}"`,
    ].join(','),
  );
  const file = path.join(OUT_DIR, 'difficulty.csv');
  fs.writeFileSync(file, [header, ...lines].join('\n') + '\n');
  return file;
}

// ---------- HTML report ----------

const W = 960;
const H = 300;
const M = { l: 48, r: 16, t: 20, b: 34 };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function niceStep(max: number, maxTicks = 6): number {
  const steps = [5, 10, 15, 20, 30, 60, 120, 180, 300];
  return steps.find(s => max / s <= maxTicks) ?? 600;
}

function yAxis(yMax: number, step: number, y: (v: number) => number, unit: string): string {
  let out = '';
  for (let v = 0; v <= yMax + 1e-9; v += step) {
    const yy = y(v).toFixed(1);
    out += `<line class="grid" x1="${M.l}" x2="${W - M.r}" y1="${yy}" y2="${yy}"/>`;
    out += `<text class="tick" x="${M.l - 6}" y="${yy}" text-anchor="end" dy="0.32em">${+v.toFixed(2)}${unit}</text>`;
  }
  return out;
}

function timelineChart(rows: Row[]): string {
  const n = rows.length;
  const yMaxRaw = Math.max(...rows.map(r => r.p90));
  const step = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / step) * step;
  const x = (id: number) => M.l + ((id - 1) / Math.max(1, n - 1)) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);

  const medianPath = rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.id).toFixed(1)},${y(r.median).toFixed(1)}`).join('');
  const targetPath = rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.id).toFixed(1)},${y(r.target).toFixed(1)}`).join('');
  const band =
    rows.map(r => `${x(r.id).toFixed(1)},${y(r.median).toFixed(1)}`).join(' ') +
    ' ' +
    [...rows]
      .reverse()
      .map(r => `${x(r.id).toFixed(1)},${y(r.p90).toFixed(1)}`)
      .join(' ');

  let xTicks = '';
  for (let world = 0; world <= n / LEVELS_PER_WORLD; world++) {
    const id = Math.max(1, world * LEVELS_PER_WORLD);
    const xx = x(id).toFixed(1);
    xTicks += `<line class="axis" x1="${xx}" x2="${xx}" y1="${H - M.b}" y2="${H - M.b + 4}"/>`;
    if (world % 5 === 0) {
      xTicks += `<text class="tick" x="${xx}" y="${H - M.b + 18}" text-anchor="middle">${id}</text>`;
    }
  }

  // "Harder than its landmark" is a stretch-wide problem (the world shape shows it); dots here mark single-level ones
  const flagged = rows
    .filter(r => r.flags.some(f => f.kind !== 'outranks-peak'))
    .map(r => `<circle class="flag" cx="${x(r.id).toFixed(1)}" cy="${y(r.median).toFixed(1)}" r="4"/>`)
    .join('');

  return `<svg id="timeline" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated solve time for every level">
  ${yAxis(yMax, step, y, 's')}
  <line class="axis" x1="${M.l}" x2="${W - M.r}" y1="${H - M.b}" y2="${H - M.b}"/>
  ${xTicks}
  <text class="tick" x="${W - M.r}" y="${H - 2}" text-anchor="end">level</text>
  <polygon class="band" points="${band}"/>
  <path class="line" d="${medianPath}"/>
  <path class="target" d="${targetPath}"/>
  ${flagged}
  <line id="tl-cross" class="cross" y1="${M.t}" y2="${H - M.b}" visibility="hidden"/>
</svg>`;
}

function rhythmChart(shape: number[], planned: number[]): string {
  const yMax = Math.ceil(Math.max(...shape, ...planned) * 4) / 4;
  const x = (k: number) => M.l + ((k - 1) / (LEVELS_PER_WORLD - 1)) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const half = (W - M.l - M.r) / (LEVELS_PER_WORLD - 1) / 2;

  const zone = (from: number, to: number, label: string) =>
    `<rect class="zone" x="${(x(from) - half).toFixed(1)}" y="${M.t}" width="${(x(to) - x(from) + 2 * half).toFixed(1)}" height="${H - M.t - M.b}"/>` +
    `<text class="zone-label" x="${((x(from) + x(to)) / 2).toFixed(1)}" y="${M.t + 12}" text-anchor="middle">${label}</text>`;
  const landmarks = [15, 30, 45, 60]
    .map(k => {
      const xx = x(k).toFixed(1);
      const label = k === LEVELS_PER_WORLD ? 'finale' : 'landmark';
      return `<line class="landmark" x1="${xx}" x2="${xx}" y1="${M.t}" y2="${H - M.b}"/><text class="zone-label" x="${xx}" y="${H - M.b - 6}" text-anchor="middle">${label}</text>`;
    })
    .join('');

  const pathOf = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const dots = shape.map((v, i) => `<circle class="dot" cx="${x(i + 1).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4"/>`).join('');
  const xTicks = [1, 10, 20, 30, 40, 50, 60]
    .map(k => `<text class="tick" x="${x(k).toFixed(1)}" y="${H - M.b + 18}" text-anchor="middle">${k}</text>`)
    .join('');

  return `<svg id="rhythm" viewBox="0 0 ${W} ${H}" role="img" aria-label="Average difficulty shape inside a world">
  ${zone(1, 5, 'warm-up')}${zone(16, 17, 'breather')}${zone(46, 59, 'hard stretch')}
  ${yAxis(yMax, 0.25, y, '×')}
  <line class="avg" x1="${M.l}" x2="${W - M.r}" y1="${y(1).toFixed(1)}" y2="${y(1).toFixed(1)}"/>
  <line class="axis" x1="${M.l}" x2="${W - M.r}" y1="${H - M.b}" y2="${H - M.b}"/>
  ${landmarks}${xTicks}
  <text class="tick" x="${W - M.r}" y="${H - 2}" text-anchor="end">level in world</text>
  <path class="target" d="${pathOf(planned)}"/>
  <path class="line" d="${pathOf(shape)}"/>
  ${dots}
  <line id="rh-cross" class="cross" y1="${M.t}" y2="${H - M.b}" visibility="hidden"/>
</svg>`;
}

function writeHtml(rows: Row[], shape: number[], planned: number[]): string {
  const fastest = rows.reduce((a, b) => (b.median < a.median ? b : a));
  const slowest = rows.reduce((a, b) => (b.median > a.median ? b : a));
  const flaggedRows = rows.filter(r => r.flags.length > 0);
  const worlds = [...new Set(rows.map(r => r.world))].map(world => {
    const ws = rows.filter(r => r.world === world);
    return {
      world,
      avg: mean(ws.map(r => r.median)),
      min: Math.min(...ws.map(r => r.median)),
      max: Math.max(...ws.map(r => r.median)),
      flagged: ws.filter(r => r.flags.length > 0).length,
    };
  });

  const tile = (label: string, value: string, note = '') =>
    `<div class="tile"><div class="tile-label">${label}</div><div class="tile-value">${value}</div><div class="tile-note">${note}</div></div>`;

  const data = rows.map(r => [
    r.id,
    r.world,
    r.inWorld,
    r.role,
    sec(r.median),
    sec(r.p90),
    +r.hints.toFixed(2),
    r.flags.map(f => f.note).join('; '),
    sec(r.target),
  ]);
  // Worlds 1-3 open new directions on some levels (intro); world 5 shows the usual role of each slot
  const roleAt = (k: number) => levelRole(LEVELS_PER_WORLD * 4 + k);
  const shapeData = shape.map((v, i) => [i + 1, +v.toFixed(2), roleAt(i + 1), +planned[i].toFixed(2)]);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WordEase Difficulty Report</title>
<style>
:root {
  color-scheme: light;
  --surface: #fcfcfb; --surface-2: #f3f2ef; --text: #0b0b0b; --text-2: #52514e; --muted: #8a8984;
  --grid: #e6e5e0; --axis: #b9b8b2; --zone: #efeee9; --series: #2a78d6; --band: #b7d3f6; --flag: #eb6834;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --surface: #1a1a19; --surface-2: #232321; --text: #f0efec; --text-2: #c3c2b7; --muted: #8f8e88;
    --grid: #2e2e2b; --axis: #55544f; --zone: #262624; --series: #3987e5; --band: #1c5cab; --flag: #d95926;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --surface: #1a1a19; --surface-2: #232321; --text: #f0efec; --text-2: #c3c2b7; --muted: #8f8e88;
  --grid: #2e2e2b; --axis: #55544f; --zone: #262624; --series: #3987e5; --band: #1c5cab; --flag: #d95926;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--surface); color: var(--text); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1000px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 16px; margin: 32px 0 4px; }
p.sub { color: var(--text-2); margin: 0 0 12px; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 16px; }
.tile { background: var(--surface-2); border-radius: 8px; padding: 12px; }
.tile-label { color: var(--text-2); font-size: 12px; }
.tile-value { font-size: 22px; font-weight: 600; }
.tile-note { color: var(--muted); font-size: 12px; }
.chart { position: relative; }
svg { width: 100%; height: auto; display: block; overflow: visible; }
.grid { stroke: var(--grid); stroke-width: 1; }
.axis { stroke: var(--axis); stroke-width: 1; }
.tick { fill: var(--muted); font-size: 11px; }
.line { fill: none; stroke: var(--series); stroke-width: 2; stroke-linejoin: round; }
.band { fill: var(--band); opacity: 0.55; }
.flag { fill: var(--flag); stroke: var(--surface); stroke-width: 2; }
.dot { fill: var(--series); stroke: var(--surface); stroke-width: 2; }
.zone { fill: var(--zone); }
.zone-label { fill: var(--text-2); font-size: 11px; }
.landmark { stroke: var(--axis); stroke-dasharray: 3 3; }
.avg { stroke: var(--text-2); stroke-dasharray: 4 4; }
.cross { stroke: var(--text-2); stroke-width: 1; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; color: var(--text-2); font-size: 12px; margin: 6px 0; }
.key { display: inline-block; vertical-align: middle; margin-right: 6px; }
.key-line { width: 16px; height: 2px; background: var(--series); }
.key-target { width: 16px; height: 0; border-top: 2px dashed var(--text-2); }
.target { fill: none; stroke: var(--text-2); stroke-width: 1.5; stroke-dasharray: 5 4; }
.key-band { width: 16px; height: 10px; background: var(--band); opacity: 0.55; }
.key-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--flag); }
.tip { position: absolute; pointer-events: none; background: var(--surface); color: var(--text); border: 1px solid var(--grid);
  border-radius: 6px; padding: 6px 8px; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.15); max-width: 260px; display: none; }
.tip b { font-weight: 600; }
.tip .muted { color: var(--text-2); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--grid); }
th { color: var(--text-2); font-weight: 600; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.scroll { max-height: 420px; overflow: auto; border: 1px solid var(--grid); border-radius: 8px; }
.table-wrap { overflow-x: auto; }
</style>
</head>
<body>
<main>
<h1>WordEase difficulty report</h1>
<p class="sub">Search bot played each of the ${rows.length} shipped levels ${RUNS} times. Times are bot guesses until phone play data calibrates them (D4); trust the shape more than the seconds.</p>

<div class="tiles">
  ${tile('Easiest level', `${sec(fastest.median)} s`, `level ${fastest.id}`)}
  ${tile('Hardest level', `${sec(slowest.median)} s`, `level ${slowest.id}`)}
  ${tile('Near target', `${nearTarget(rows)} / ${rows.length}`, `within ±${Math.round((NEAR - 1) * 100)}% of its target time`)}
  ${tile('Dips not easier', String(flagCount(rows, 'dip')), 'warm-up, breather or intro')}
  ${tile('Harder than its landmark', String(flagCount(rows, 'outranks-peak')), 'peak in the wrong place')}
  ${tile('Sudden jumps', String(flagCount(rows, 'spike')), `rise above ${Math.round((SPIKE - 1) * 100)}% from the level before`)}
</div>

<h2>Every level</h2>
<p class="sub">Typical solve time per level, with the slow-player time (9 in 10 finish faster) as the band above it.</p>
<div class="legend">
  <span><span class="key key-line"></span>Typical (median)</span>
  <span><span class="key key-target"></span>Target</span>
  <span><span class="key key-band"></span>Up to slow player (p90)</span>
  <span><span class="key key-dot"></span>Dip not easier, or sudden jump</span>
</div>
<div class="chart">${timelineChart(rows)}<div class="tip" id="tl-tip"></div></div>

<h2>Shape of an average world</h2>
<p class="sub">Each level's time divided by its world's average, averaged over all 20 worlds. The line should dip in the shaded easy zones, rise at landmarks and top out at the finale.</p>
<div class="legend">
  <span><span class="key key-line"></span>Bot time</span>
  <span><span class="key key-target"></span>Target</span>
</div>
<div class="chart">${rhythmChart(shape, planned)}<div class="tip" id="rh-tip"></div></div>

<h2>Worlds</h2>
<div class="table-wrap"><table>
<thead><tr><th>World</th><th class="num">Average</th><th class="num">Easiest</th><th class="num">Hardest</th><th class="num">Flagged</th></tr></thead>
<tbody>${worlds
    .map(w => `<tr><td>${w.world}</td><td class="num">${sec(w.avg)} s</td><td class="num">${sec(w.min)} s</td><td class="num">${sec(w.max)} s</td><td class="num">${w.flagged}</td></tr>`)
    .join('')}</tbody>
</table></div>

<h2>Flagged levels (${flaggedRows.length})</h2>
<div class="scroll"><table>
<thead><tr><th class="num">Level</th><th>Planned</th><th class="num">Typical</th><th class="num">Slow</th><th>Why</th></tr></thead>
<tbody>${flaggedRows
    .map(r => `<tr><td class="num">${r.id}</td><td>${r.role}</td><td class="num">${sec(r.median)} s</td><td class="num">${sec(r.p90)} s</td><td>${esc(r.flags.map(f => f.note).join('; '))}</td></tr>`)
    .join('')}</tbody>
</table></div>
</main>
<script>
const LEVELS = ${JSON.stringify(data)};
const SHAPE = ${JSON.stringify(shapeData)};
const M = ${JSON.stringify(M)}, W = ${W};

function hover(svgId, crossId, tipId, count, html) {
  const svg = document.getElementById(svgId);
  const cross = document.getElementById(crossId);
  const tip = document.getElementById(tipId);
  const box = svg.parentElement;
  svg.addEventListener('pointermove', e => {
    const rect = svg.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    const t = Math.min(1, Math.max(0, (vx - M.l) / (W - M.l - M.r)));
    const i = Math.round(t * (count - 1));
    const cx = M.l + (i / (count - 1)) * (W - M.l - M.r);
    cross.setAttribute('x1', cx);
    cross.setAttribute('x2', cx);
    cross.setAttribute('visibility', 'visible');
    tip.innerHTML = html(i);
    tip.style.display = 'block';
    const px = (cx / W) * rect.width;
    const left = px + 12 + tip.offsetWidth > rect.width ? px - 12 - tip.offsetWidth : px + 12;
    tip.style.left = left + 'px';
    tip.style.top = Math.max(0, e.clientY - rect.top - tip.offsetHeight - 8) + 'px';
  });
  svg.addEventListener('pointerleave', () => {
    cross.setAttribute('visibility', 'hidden');
    tip.style.display = 'none';
  });
}

hover('timeline', 'tl-cross', 'tl-tip', LEVELS.length, i => {
  const [id, world, inWorld, role, median, p90, hints, flags, target] = LEVELS[i];
  return '<b>Level ' + id + '</b> <span class="muted">world ' + world + ', #' + inWorld + ', ' + role + '</span><br>' +
    'Typical ' + median + ' s · target ' + target + ' s<br>Slow ' + p90 + ' s · hints ' + hints +
    (flags ? '<br><span class="muted">' + flags + '</span>' : '');
});
hover('rhythm', 'rh-cross', 'rh-tip', SHAPE.length, i => {
  const [k, v, role, planned] = SHAPE[i];
  return '<b>Level ' + k + ' of a world</b><br>' + v + '× the world average (target ' + planned + '×)<br><span class="muted">' + role + '</span>';
});
</script>
</body>
</html>
`;
}

function main(): void {
  const started = Date.now();
  const rows = measure(loadLevels());
  addFlags(rows);
  const shape = rhythmShape(rows, r => r.median);
  const planned = rhythmShape(rows, r => r.target);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const csv = writeCsv(rows);
  const html = path.join(OUT_DIR, 'difficulty-report.html');
  fs.writeFileSync(html, writeHtml(rows, shape, planned));

  const fastest = rows.reduce((a, b) => (b.median < a.median ? b : a));
  const slowest = rows.reduce((a, b) => (b.median > a.median ? b : a));
  console.log(`${rows.length} levels, ${RUNS} bot runs each, ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log(`typical time: ${sec(fastest.median)} s (level ${fastest.id}) to ${sec(slowest.median)} s (level ${slowest.id})`);
  console.log(`near target (±${Math.round((NEAR - 1) * 100)}%): ${nearTarget(rows)} / ${rows.length}`);
  console.log(`stored difficulty differs from bot: ${rows.filter(r => r.stored !== sec(r.median)).length} levels`);
  console.log(
    `flags: dip not easier ${flagCount(rows, 'dip')}, harder than its landmark ${flagCount(rows, 'outranks-peak')}, jumps ${flagCount(rows, 'spike')}`,
  );
  console.log('world shape (x world average):');
  console.log(shape.map((v, i) => `${i + 1}:${v.toFixed(2)}`).join(' '));
  console.log(`-> ${path.relative(ROOT, csv)}\n-> ${path.relative(ROOT, html)}`);
}

main();
