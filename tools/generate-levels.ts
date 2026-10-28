/**
 * Builds the launch level packs: assets/levels/en/world-XX.json and assets/meanings/en.json.
 * Run: npx tsx tools/generate-levels.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkLevel, wordsInGrid } from '../src/game/generator/checks';
import { generateLevel } from '../src/game/generator/generateLevel';
import { LEVELS_PER_WORLD, levelSpec } from '../src/game/levels/levelSpec';
import { THEMES_BY_WORLD } from '../src/game/levels/themes';
import { LevelDef } from '../src/game/types';
import { loadBlocklist, loadEnable, loadExtraMeanings, wordNetMeanings } from './wordData';

const ROOT = path.resolve(__dirname, '..');
const WORLDS = THEMES_BY_WORLD.length;
const MAX_SALT = 300;
const BONUS_MIN = 4;
const BONUS_MAX = 8;

const themeWords = new Set(THEMES_BY_WORLD.flat().flatMap(t => t.words));
const meanings = { ...wordNetMeanings(themeWords), ...loadExtraMeanings() };
const missing = [...themeWords].filter(w => !meanings[w]).sort();
if (missing.length > 0) {
  console.error(`No meaning for ${missing.length} words: ${missing.join(', ')}`);
  process.exit(1);
}

const enable = loadEnable();
const blocklist = loadBlocklist();
// The app runs the same check on puzzles it makes itself (Daily, Classic Play)
fs.writeFileSync(
  path.join(ROOT, 'src', 'game', 'generator', 'blocklist.en.json'),
  JSON.stringify([...blocklist].sort()) + '\n',
);
const bonusDictionary = new Set([...enable].filter(w => !blocklist.has(w)));

function buildLevel(levelId: number): LevelDef {
  for (let salt = 0; salt < MAX_SALT; salt++) {
    const spec = levelSpec(levelId, salt);
    let level: LevelDef;
    try {
      level = generateLevel(spec);
    } catch {
      continue; // words did not fit with this seed
    }
    const problems = checkLevel(level, {
      allowedDirs: spec.dirs,
      minReversedShare: spec.reversedShare,
      featuredDirs: spec.featuredDirs,
      blocklist,
      meanings,
    });
    if (problems.length > 0) continue;

    const found = wordsInGrid(level.grid, bonusDictionary, BONUS_MIN, BONUS_MAX);
    const bonus = [...found].filter(w => !themeWords.has(w)).sort();
    return { ...level, bonus };
  }
  throw new Error(`Level ${levelId}: no valid puzzle after ${MAX_SALT} tries`);
}

const outDir = path.join(ROOT, 'assets', 'levels', 'en');
fs.mkdirSync(outDir, { recursive: true });

for (let world = 1; world <= WORLDS; world++) {
  const levels: LevelDef[] = [];
  for (let i = 1; i <= LEVELS_PER_WORLD; i++) {
    levels.push(buildLevel((world - 1) * LEVELS_PER_WORLD + i));
  }
  const file = path.join(outDir, `world-${String(world).padStart(2, '0')}.json`);
  fs.writeFileSync(file, JSON.stringify(levels));
  console.log(`world ${world}: ${levels.length} levels -> ${path.relative(ROOT, file)}`);
}

const usedMeanings = Object.fromEntries([...themeWords].sort().map(w => [w, meanings[w]]));
const meaningsDir = path.join(ROOT, 'assets', 'meanings');
fs.mkdirSync(meaningsDir, { recursive: true });
fs.writeFileSync(path.join(meaningsDir, 'en.json'), JSON.stringify(usedMeanings, null, 1));
console.log(`meanings: ${Object.keys(usedMeanings).length} words`);
