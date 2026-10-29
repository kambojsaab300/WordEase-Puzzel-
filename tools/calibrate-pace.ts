/**
 * Reads the text shared from the phone's Play data screen and says how the bot's clock
 * compares with a real player. Changes nothing; prints what to change.
 * Run: npm run levels:calibrate -- path/to/play-data.csv
 */
import fs from 'node:fs';
import { DEFAULT_PACE, Pace } from '../src/game/difficulty/searchBot';
import { fitPace, PaceSample, PLAY_CSV_HEADER } from '../src/game/difficulty/calibration';
import { levelRole, Role } from '../src/game/levels/levelSpec';

// Pace fields that are seconds; the rest are chances and counts, which a time scale must not touch
const SECONDS_FIELDS: (keyof Pace)[] = ['perWord', 'look', 'check', 'follow', 'hint'];

function readSamples(file: string): PaceSample[] {
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  if (lines[0]?.trim() !== PLAY_CSV_HEADER) {
    throw new Error(`Not a Play data export: first line should be "${PLAY_CSV_HEADER}"`);
  }
  const samples: PaceSample[] = [];
  for (const line of lines.slice(1)) {
    const [level, seconds, , bot, , , , resized] = line.split(',');
    if (!seconds || !bot || resized === '1') continue;
    samples.push({ levelId: Number(level), seconds: Number(seconds), botSeconds: Number(bot) });
  }
  return samples;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run levels:calibrate -- path/to/play-data.csv');
  process.exit(1);
}

const samples = readSamples(file);
const fit = fitPace(samples);
if (!fit) {
  console.log('No timed first wins in this file yet.');
  process.exit(0);
}

console.log(`${fit.n} first wins`);
console.log(`your time ÷ bot time (typical level): ${fit.scale.toFixed(2)}×`);
console.log(
  fit.rankMatch === null
    ? 'rank match: needs 5 or more levels'
    : `rank match with the bot: ${fit.rankMatch.toFixed(2)} (1 = same order of easy to hard)`,
);

// A role far from the overall scale means the bot misjudges that kind of level, not just the speed
console.log('\nby role (ratio ÷ overall; 1.00 = the bot has this role right):');
const byRole = new Map<Role, PaceSample[]>();
for (const s of samples) byRole.set(levelRole(s.levelId), [...(byRole.get(levelRole(s.levelId)) ?? []), s]);
for (const [role, list] of byRole) {
  const roleFit = fitPace(list)!;
  console.log(`  ${role.padEnd(8)} ${String(list.length).padStart(3)} levels  ${(roleFit.scale / fit.scale).toFixed(2)}`);
}

console.log('\nscaled pace for src/game/difficulty/searchBot.ts (DEFAULT_PACE):');
for (const key of SECONDS_FIELDS) {
  console.log(`  ${key}: ${+(DEFAULT_PACE[key] * fit.scale).toFixed(3)},`);
}
console.log(
  '\nA single scale moves every bot time and target by the same factor, so it changes no level choice.' +
    '\nScale START and END in src/game/difficulty/target.ts by the same factor along with the pace.' +
    '\nOnly role ratios far from 1.00 or a low rank match call for retuning the bot itself.',
);
