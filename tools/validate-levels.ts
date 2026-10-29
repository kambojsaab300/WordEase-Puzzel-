/**
 * Re-checks every shipped level. Exits with code 1 if any level fails, so CI can stop the build.
 * Run: npx tsx tools/validate-levels.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { rhythmBounds, withinBounds } from '../src/game/difficulty/target';
import { checkLevel } from '../src/game/generator/checks';
import { levelRole, levelSpec } from '../src/game/levels/levelSpec';
import { LevelDef } from '../src/game/types';
import { loadTuning, tunedTarget } from './levelTuning';
import { loadBlocklist } from './wordData';

const ROOT = path.resolve(__dirname, '..');
// How far a level's bot time may sit from its target before it counts as broken. Wide on purpose:
// near the end of a band the grid size cannot reach the curve; the report shows the closer fit
const TARGET_TOLERANCE = 1.5;

/** `difficulty` holds the bot's typical seconds (the level tool's pick); the sawtooth is checked on it. */
function difficultyProblems(levels: LevelDef[]): string[] {
  const seconds = new Map(levels.map(l => [l.id, l.difficulty]));
  const tuning = loadTuning();
  const failures: string[] = [];
  for (const { id, difficulty } of levels) {
    const target = tunedTarget(tuning, id);
    if (difficulty > target * TARGET_TOLERANCE || difficulty < target / TARGET_TOLERANCE) {
      failures.push(`level ${id}: ${difficulty} s is far from its target ${Math.round(target)} s`);
    }
    if (!withinBounds(difficulty, rhythmBounds(id, other => seconds.get(other)))) {
      failures.push(`level ${id}: ${levelRole(id)} at ${difficulty} s breaks the sawtooth`);
    }
  }
  return failures;
}

export function validateShippedLevels(): string[] {
  const dir = path.join(ROOT, 'assets', 'levels', 'en');
  const meanings = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'meanings', 'en.json'), 'utf8'));
  const blocklist = loadBlocklist();
  const failures: string[] = [];
  const all: LevelDef[] = [];

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const levels: LevelDef[] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    all.push(...levels);
    for (const level of levels) {
      const spec = levelSpec(level.id);
      const ctx = {
        allowedDirs: spec.dirs,
        minReversedShare: spec.reversedShare,
        featuredDirs: spec.featuredDirs,
        blocklist,
        meanings,
      };
      for (const problem of checkLevel(level, ctx)) {
        failures.push(`level ${level.id}: ${problem}`);
      }
    }
  }
  return [...failures, ...difficultyProblems(all)];
}

if (require.main === module) {
  const failures = validateShippedLevels();
  failures.forEach(f => console.error(f));
  console.log(failures.length === 0 ? 'All levels OK' : `${failures.length} problems`);
  process.exit(failures.length === 0 ? 0 : 1);
}
