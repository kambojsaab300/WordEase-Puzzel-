/**
 * Re-checks every shipped level. Exits with code 1 if any level fails, so CI can stop the build.
 * Run: npx tsx tools/validate-levels.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkLevel } from '../src/game/generator/checks';
import { levelSpec } from '../src/game/levels/levelSpec';
import { LevelDef } from '../src/game/types';
import { loadBlocklist } from './wordData';

const ROOT = path.resolve(__dirname, '..');

export function validateShippedLevels(): string[] {
  const dir = path.join(ROOT, 'assets', 'levels', 'en');
  const meanings = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'meanings', 'en.json'), 'utf8'));
  const blocklist = loadBlocklist();
  const failures: string[] = [];

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const levels: LevelDef[] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const level of levels) {
      const allowedDirs = levelSpec(level.id).dirs;
      for (const problem of checkLevel(level, { allowedDirs, blocklist, meanings })) {
        failures.push(`level ${level.id}: ${problem}`);
      }
    }
  }
  return failures;
}

if (require.main === module) {
  const failures = validateShippedLevels();
  failures.forEach(f => console.error(f));
  console.log(failures.length === 0 ? 'All levels OK' : `${failures.length} problems`);
  process.exit(failures.length === 0 ? 0 : 1);
}
