import { estimateLevel } from '../src/game/difficulty/searchBot';
import { rhythmBounds, targetSeconds, withinBounds } from '../src/game/difficulty/target';
import { getLevel } from '../src/game/levels/levelRepo';
import { levelRole, levelSpec } from '../src/game/levels/levelSpec';

describe('level roles', () => {
  test.each([
    [1, 'warm-up'],
    [11, 'intro'],
    [15, 'peak'],
    [16, 'breather'],
    [20, 'normal'],
    [50, 'hard'],
    [60, 'finale'],
    [61, 'intro'],
    [241, 'warm-up'],
    [300, 'finale'],
  ])('level %i is %s', (id, role) => {
    expect(levelRole(id)).toBe(role);
  });
});

describe('targetSeconds', () => {
  test('inside a world: dips < normal < hard < landmark < finale', () => {
    const at = (inWorld: number) => targetSeconds(4 * 60 + inWorld); // world 5, no intro levels
    expect(at(3)).toBeLessThan(at(20));
    expect(at(16)).toBeLessThan(at(15));
    expect(at(20)).toBeLessThan(at(50));
    expect(at(50)).toBeLessThan(at(45));
    expect(at(45)).toBeLessThan(at(60));
  });

  test('a new world starts well below the finale before it', () => {
    expect(targetSeconds(241)).toBeLessThan(targetSeconds(240) * 0.6);
  });

  test('the curve keeps growing across worlds', () => {
    for (let world = 1; world < 20; world++) {
      expect(targetSeconds(world * 60 + 20)).toBeGreaterThan(targetSeconds((world - 1) * 60 + 20));
    }
  });
});

describe('rhythmBounds', () => {
  const times = new Map([
    [14, 40],
    [15, 60],
    [16, 30],
    [1, 20],
    [5, 25],
  ]);
  const secondsOf = (id: number) => times.get(id);

  test('a breather must beat the last level that was not a dip', () => {
    expect(rhythmBounds(17, secondsOf)).toEqual({ below: 60 });
    expect(withinBounds(50, { below: 60 })).toBe(true);
    expect(withinBounds(60, { below: 60 })).toBe(false);
  });

  test('a landmark must top every level since the previous landmark', () => {
    expect(rhythmBounds(15, secondsOf)).toEqual({ above: 40 });
    expect(rhythmBounds(30, secondsOf)).toEqual({ above: 30 });
  });

  test('the finale must top its whole world', () => {
    expect(rhythmBounds(60, secondsOf)).toEqual({ above: 60 });
  });

  test('normal levels have no hard limits', () => {
    expect(rhythmBounds(20, secondsOf)).toEqual({});
  });
});

describe('level tool tweaks', () => {
  test('a tweak changes the word count and grid size within the band', () => {
    const plain = levelSpec(500);
    const fewer = levelSpec(500, 0, { words: -2, size: -1 });
    expect(fewer.words.length).toBeLessThan(plain.words.length);
    expect(fewer.rows).toBeLessThan(plain.rows);
  });

  test('peaks get harder through placement, not extra words', () => {
    expect(levelSpec(615).reversedShare!).toBeGreaterThan(levelSpec(614).reversedShare!);
    expect(levelSpec(615).decoyShare!).toBeGreaterThan(levelSpec(614).decoyShare ?? 0);
  });
});

describe('shipped levels', () => {
  // `difficulty` must be the bot's real number, or the sawtooth checks would check nothing
  test.each([1, 15, 60, 61, 300, 615, 1200])('level %i stores its bot time', id => {
    const level = getLevel(id);
    expect(level.difficulty).toBe(Math.round(estimateLevel(level, levelSpec(id).dirs).median));
  });
});
