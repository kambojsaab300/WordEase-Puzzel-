import { levelReward } from '../src/game/engine/rewards';
import { WORLDS } from '../src/game/levels/worlds';
import { DICTIONARIES, SUPPORTED_LANGUAGES, translate } from '../src/i18n';
import { LANDMARK_PATHS } from '../src/map/landmarks';
import {
  LANDMARK_ART,
  LANDMARK_PLAN,
  landmarkAt,
  landmarkKey,
  LANDMARKS_PER_WORLD,
  visitedCount,
  worldLandmarks,
} from '../src/map/landmarkPlan';

const allKeys = WORLDS.flatMap(w => [...LANDMARK_PLAN[w.id]]);

// Splits an SVG path into commands and numbers; anything else means a typo in the artwork
function parsePath(d: string) {
  const tokens = d.match(/[MLHVQAZ]|-?\d*\.?\d+/gi) ?? [];
  const leftover = d.replace(/[MLHVQAZ]|-?\d*\.?\d+|[\s,]/gi, '');
  return { tokens, leftover };
}

describe('landmarks visual plan', () => {
  test('every world has 4 landmarks, one per landmark level, 80 in all and no repeats', () => {
    expect(LANDMARKS_PER_WORLD).toBe(4);
    for (const w of WORLDS) expect(LANDMARK_PLAN[w.id]).toHaveLength(4);
    expect(allKeys).toHaveLength(80);
    expect(new Set(allKeys).size).toBe(80);
  });

  test('the first landmark of a world is its signature shape (same as the passport stamp)', () => {
    for (const w of WORLDS) {
      expect(worldLandmarks(w.id)[0].path).toBe(LANDMARK_PATHS[w.landmark]);
    }
  });

  test('every landmark has its own artwork; no two share a silhouette', () => {
    const paths = allKeys.map(k => LANDMARK_ART[k]);
    expect(paths.every(Boolean)).toBe(true);
    expect(new Set(paths).size).toBe(80);
  });

  test.each(allKeys)('%s artwork is a clean path inside the 100 x 100 box', key => {
    const { tokens, leftover } = parsePath(LANDMARK_ART[key]);
    expect(leftover).toBe('');
    expect(tokens[0]).toBe('M');
    const numbers = tokens.filter(tk => !/[A-Z]/i.test(tk)).map(Number);
    expect(numbers.length).toBeGreaterThan(4);
    for (const n of numbers) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    }
  });

  test.each(SUPPORTED_LANGUAGES.map(l => l.code))('%s names all 80 landmarks', lang => {
    const dict = DICTIONARIES[lang] as Record<string, string>;
    const missing = allKeys.filter(k => !dict[landmarkKey(k)]?.trim());
    expect(missing).toEqual([]);
  });
});

describe('landmarkAt', () => {
  test('maps levels 15/30/45/60 of each world to its landmarks in order', () => {
    expect(landmarkAt(15)).toMatchObject({ key: 'cottage', index: 0, levelId: 15 });
    expect(landmarkAt(75)).toMatchObject({ key: 'eiffelTower', index: 0 });
    expect(landmarkAt(90)).toMatchObject({ key: 'arcDeTriomphe', index: 1 });
    expect(landmarkAt(420)).toMatchObject({ key: 'hawaMahal', index: 3 });
    expect(landmarkAt(1200)).toMatchObject({ key: 'researchHut', index: 3 });
    expect(landmarkAt(420)?.world.name).toBe('India');
  });

  test('ordinary levels and out-of-range ids have no landmark (negative)', () => {
    for (const id of [0, 1, 14, 16, 59, 61, -15, 1215, 15.5, NaN]) expect(landmarkAt(id)).toBeNull();
  });

  test('worldLandmarks lists the 4 landmark levels of a world', () => {
    expect(worldLandmarks(7).map(l => l.levelId)).toEqual([375, 390, 405, 420]);
    expect(worldLandmarks(99)).toEqual([]);
  });

  test('visited count follows won levels, per world and in total', () => {
    const stars = { 15: 3, 30: 1, 60: 2, 75: 3, 14: 3 };
    expect(visitedCount(stars, 1)).toBe(3);
    expect(visitedCount(stars, 2)).toBe(1);
    expect(visitedCount(stars)).toBe(4);
    expect(visitedCount({})).toBe(0);
  });

  test('node label reads the landmark name after the level state', () => {
    const label = translate('en', 'map.node.landmark', {
      label: translate('en', 'map.node.locked', { n: 15 }),
      name: translate('en', landmarkKey('cottage')),
    });
    expect(label).toBe('Level 15, locked, landmark: Village Cottage');
    expect(translate('hi', landmarkKey('tajMahal'))).toBe('ताज महल');
  });
});

describe('landmark reward flag', () => {
  test('first win of a landmark level is a new landmark; replays and other levels are not', () => {
    expect(levelReward(15, 3).landmarkVisited).toBe(true);
    expect(levelReward(60, 2).landmarkVisited).toBe(true);
    expect(levelReward(15, 3, 2).landmarkVisited).toBe(false);
    expect(levelReward(14, 3).landmarkVisited).toBe(false);
  });
});
