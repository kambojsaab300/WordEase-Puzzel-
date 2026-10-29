/**
 * Builds the launch level packs: assets/levels/en/world-XX.json and assets/meanings/en.json.
 * Every level is picked from a dozen candidate puzzles by the search bot: the one closest to
 * its target time that keeps the world's sawtooth (docs/DIFFICULTY-FLOW.md).
 * Run: npx tsx tools/generate-levels.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { estimateLevel } from '../src/game/difficulty/searchBot';
import { Bounds, rhythmBounds, withinBounds } from '../src/game/difficulty/target';
import { checkLevel, wordsInGrid } from '../src/game/generator/checks';
import { generateLevel, LevelSpec } from '../src/game/generator/generateLevel';
import {
  LANDMARK_EVERY,
  LEVELS_PER_WORLD,
  levelInWorld,
  levelRole,
  levelSpec,
  PEAK_ROLES,
  SpecTweak,
} from '../src/game/levels/levelSpec';
import { THEMES_BY_WORLD } from '../src/game/levels/themes';
import { LevelDef } from '../src/game/types';
import { loadTuning, tunedTarget } from './levelTuning';
import { loadBlocklist, loadEnable, loadExtraMeanings, wordNetMeanings } from './wordData';

const ROOT = path.resolve(__dirname, '..');
const WORLDS = THEMES_BY_WORLD.length;
const SALTS_PER_TWEAK = 40;
const TWEAKS: SpecTweak[] = [-2, -1, 0, 1].flatMap(words => [-1, 0, 1].map(size => ({ words, size })));
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

type Candidate = { level: LevelDef; spec: LevelSpec; tweak: SpecTweak; seconds: number };

function firstValid(levelId: number, tweak: SpecTweak): Candidate | null {
  for (let salt = 0; salt < SALTS_PER_TWEAK; salt++) {
    const spec = levelSpec(levelId, salt, tweak);
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
    // Rounded, so the sawtooth checks here and in the validator compare the very same numbers
    return { level, spec, tweak, seconds: Math.round(estimateLevel(level, spec.dirs).median) };
  }
  return null;
}

const isShort = (c: Candidate) => (c.tweak.words ?? 0) <= 0;

/**
 * Closest to target among the candidates that keep the sawtooth. Peaks first try without
 * extra words (hard levels stay short). If nothing keeps the sawtooth, the candidate that
 * comes nearest to it wins and the validator will name the level.
 */
// Live tuning (D6) shortens the target of levels players struggled with
const tuning = loadTuning();

function pick(levelId: number, candidates: Candidate[], bounds: Bounds): Candidate {
  const target = tunedTarget(tuning, levelId);
  const miss = (c: Candidate) => Math.abs(Math.log(c.seconds / target));
  const closest = (list: Candidate[]) => list.reduce((a, b) => (miss(b) < miss(a) ? b : a));

  const keeping = candidates.filter(c => withinBounds(c.seconds, bounds));
  const short = PEAK_ROLES.includes(levelRole(levelId)) ? keeping.filter(isShort) : keeping;
  if (short.length > 0) return closest(short);
  if (keeping.length > 0) return closest(keeping);
  if (bounds.below !== undefined) return candidates.reduce((a, b) => (b.seconds < a.seconds ? b : a));
  if (bounds.above !== undefined) return candidates.reduce((a, b) => (b.seconds > a.seconds ? b : a));
  return closest(candidates);
}

function buildWorld(world: number, chosen: Map<number, number>): LevelDef[] {
  const first = (world - 1) * LEVELS_PER_WORLD + 1;
  const ids = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => first + i);
  const candidates = new Map(
    ids.map(id => {
      const list = TWEAKS.map(tweak => firstValid(id, tweak)).filter((c): c is Candidate => c !== null);
      if (list.length === 0) throw new Error(`Level ${id}: no valid puzzle`);
      return [id, list];
    }),
  );

  // Every level stays under the hardest version of the landmark closing its stretch and of the
  // finale, so each peak is always left a candidate that tops what came before it
  const peakCeiling = (id: number) => Math.max(...candidates.get(id)!.map(c => c.seconds));
  const finale = first + LEVELS_PER_WORLD - 1;
  const ceilingFor = (id: number): number | undefined => {
    const role = levelRole(id);
    if (role === 'finale') return undefined;
    if (role === 'peak') return peakCeiling(finale);
    const landmark = first - 1 + Math.ceil(levelInWorld(id) / LANDMARK_EVERY) * LANDMARK_EVERY;
    return Math.min(peakCeiling(landmark), peakCeiling(finale));
  };

  return ids.map(id => {
    const bounds = rhythmBounds(id, other => chosen.get(other));
    const ceiling = ceilingFor(id);
    if (ceiling !== undefined) bounds.below = Math.min(bounds.below ?? Infinity, ceiling);

    const { level, seconds } = pick(id, candidates.get(id)!, bounds);
    chosen.set(id, seconds);
    const found = wordsInGrid(level.grid, bonusDictionary, BONUS_MIN, BONUS_MAX);
    const bonus = [...found].filter(w => !themeWords.has(w)).sort();
    return { ...level, bonus, difficulty: seconds };
  });
}

const outDir = path.join(ROOT, 'assets', 'levels', 'en');
fs.mkdirSync(outDir, { recursive: true });

const chosen = new Map<number, number>();
for (let world = 1; world <= WORLDS; world++) {
  const levels = buildWorld(world, chosen);
  const file = path.join(outDir, `world-${String(world).padStart(2, '0')}.json`);
  fs.writeFileSync(file, JSON.stringify(levels));
  console.log(`world ${world}: ${levels.length} levels -> ${path.relative(ROOT, file)}`);
}

const usedMeanings = Object.fromEntries([...themeWords].sort().map(w => [w, meanings[w]]));
const meaningsDir = path.join(ROOT, 'assets', 'meanings');
fs.mkdirSync(meaningsDir, { recursive: true });
fs.writeFileSync(path.join(meaningsDir, 'en.json'), JSON.stringify(usedMeanings, null, 1));
console.log(`meanings: ${Object.keys(usedMeanings).length} words`);
