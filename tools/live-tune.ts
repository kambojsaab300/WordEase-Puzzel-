/**
 * D6, the King loop: find the levels real players struggle with most and mark them to be
 * made easier. King fixed its 100 least fun levels this way and engagement went up.
 *
 * Input: a CSV per level built from the Firebase export (query in docs/DIFFICULTY-FLOW.md):
 *   level,players,median_seconds,hint_rate,quit_rate
 * Output: tools/level-tuning.json (merged with earlier runs). Then run
 *   npm run levels:generate && npm run levels:validate
 * to rebuild those levels. Run: npm run levels:tune -- path/to/levels.csv
 */
import fs from 'node:fs';
import { levelRole, Role } from '../src/game/levels/levelSpec';
import { loadTuning, saveTuning, tunedTarget, TUNING_FILE } from './levelTuning';

const HEADER = 'level,players,median_seconds,hint_rate,quit_rate';
// Fewer players than this is noise, not a signal
const MIN_PLAYERS = 30;
// The worst share of levels to fix in one round
const WORST_SHARE = 0.05;
// Each round makes a flagged level's target this much shorter, never below FLOOR
const EASIER = 0.85;
const FLOOR = 0.6;
// Rates of 0 would break the logs; this is "practically never"
const EPS = 0.01;

type Row = { level: number; players: number; seconds: number; hintRate: number; quitRate: number };

function readRows(file: string): Row[] {
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  if (lines[0]?.trim() !== HEADER) throw new Error(`First line must be "${HEADER}"`);
  return lines.slice(1).map(line => {
    const [level, players, seconds, hintRate, quitRate] = line.split(',').map(Number);
    return { level, players, seconds, hintRate, quitRate };
  });
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 1 : s[Math.floor(s.length / 2)];
};

/**
 * How much worse than its kind a level is: quits and hints are compared with levels of the
 * same role (a peak is allowed more than a warm-up), time with its own target. 0 = typical.
 */
export function frustration(rows: Row[], tuning: Record<string, number>): Map<number, number> {
  const usable = rows.filter(r => r.players >= MIN_PLAYERS && r.seconds > 0);
  const pace = median(usable.map(r => r.seconds / tunedTarget(tuning, r.level)));
  const byRole = new Map<Role, Row[]>();
  for (const r of usable) byRole.set(levelRole(r.level), [...(byRole.get(levelRole(r.level)) ?? []), r]);

  const scores = new Map<number, number>();
  for (const [, list] of byRole) {
    const quit = median(list.map(r => r.quitRate + EPS));
    const hint = median(list.map(r => r.hintRate + EPS));
    for (const r of list) {
      const slow = Math.log(r.seconds / (tunedTarget(tuning, r.level) * pace));
      scores.set(r.level, Math.log((r.quitRate + EPS) / quit) + Math.log((r.hintRate + EPS) / hint) + slow);
    }
  }
  return scores;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run levels:tune -- path/to/levels.csv');
    process.exit(1);
  }
  const rows = readRows(file);
  const tuning = loadTuning();
  const scores = frustration(rows, tuning);
  const ranked = [...scores].filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
  const worst = ranked.slice(0, Math.ceil(scores.size * WORST_SHARE));

  console.log(`${rows.length} levels in the file, ${scores.size} with ${MIN_PLAYERS}+ players`);
  console.log(`making ${worst.length} levels easier (worst ${Math.round(WORST_SHARE * 100)}%):`);
  const byLevel = new Map(rows.map(r => [r.level, r]));
  for (const [level, score] of worst) {
    const r = byLevel.get(level)!;
    const scale = Math.max(FLOOR, (tuning[level] ?? 1) * EASIER);
    tuning[level] = +scale.toFixed(3);
    console.log(
      `  ${String(level).padStart(4)} ${levelRole(level).padEnd(8)} score ${score.toFixed(2)}  ` +
        `quit ${(r.quitRate * 100).toFixed(0)}%  hints ${(r.hintRate * 100).toFixed(0)}%  ${r.seconds} s  → target ×${scale.toFixed(2)}`,
    );
  }
  saveTuning(tuning);
  console.log(`\n-> ${TUNING_FILE}\nNext: npm run levels:generate && npm run levels:validate && npm run levels:difficulty`);
}
