import { validateShippedLevels } from '../tools/validate-levels';
import { getLevel, meaningOf, SHIPPED_LEVELS } from '../src/game/levels/levelRepo';
import { levelSpec, rhythmDelta } from '../src/game/levels/levelSpec';
import { THEMES_BY_WORLD } from '../src/game/levels/themes';
import { WORLDS } from '../src/game/levels/worlds';

describe('shipped level packs', () => {
  // Flow: re-validate all shipped levels; one failure fails the build
  test('all 1,200 levels pass every check', () => {
    expect(validateShippedLevels()).toEqual([]);
  });

  test('levels load by id and match their world', () => {
    expect(SHIPPED_LEVELS).toBe(1200);
    for (const id of [1, 60, 61, 615, 1200]) {
      const level = getLevel(id);
      expect(level.id).toBe(id);
      expect(level.world).toBe(Math.ceil(id / 60));
    }
  });

  test('past the last pack, Classic Play generates a level', () => {
    const level = getLevel(1201);
    expect(level.id).toBe(1201);
    expect(level.words.length).toBeGreaterThan(0);
  });

  test('every theme word has a meaning', () => {
    for (const w of new Set(THEMES_BY_WORLD.flat().flatMap(t => t.words))) {
      expect(meaningOf(w)).toBeTruthy();
    }
  });

  test('bonus words never repeat theme words', () => {
    for (const id of [1, 100, 500, 1000]) {
      const level = getLevel(id);
      const theme = new Set(level.words.map(w => w.w));
      expect(level.bonus.some(b => theme.has(b))).toBe(false);
    }
  });
});

describe('worlds and rhythm', () => {
  test('20 worlds, each with themes', () => {
    expect(WORLDS).toHaveLength(20);
    expect(THEMES_BY_WORLD).toHaveLength(20);
  });

  test('sawtooth: warm-up easy, landmarks peak, breather after the first landmark', () => {
    expect(rhythmDelta(1)).toBe(-1);
    expect(rhythmDelta(15)).toBe(1);
    expect(rhythmDelta(16)).toBe(-1);
    expect(rhythmDelta(20)).toBe(0);
    expect(rhythmDelta(50)).toBe(1);
    expect(rhythmDelta(60)).toBe(1);
  });

  test('each level uses its own world themes', () => {
    const spec = levelSpec(61);
    expect(THEMES_BY_WORLD[1].map(t => t.name)).toContain(spec.theme);
  });
});
