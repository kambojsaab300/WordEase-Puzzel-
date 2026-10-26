import { celebrationFor, milestoneFor } from '../src/game/engine/celebration';
import { WORLDS } from '../src/game/levels/worlds';
import { DICTIONARIES, SUPPORTED_LANGUAGES, translate } from '../src/i18n';

describe('congrats after a level', () => {
  test('every world has its own cheer, all 20 different', () => {
    const cheers = WORLDS.map(w => translate('en', celebrationFor((w.id - 1) * 60 + 1, 3).cheerKey));
    expect(new Set(cheers).size).toBe(20);
    expect(translate('en', celebrationFor(61, 3).cheerKey)).toBe('Magnifique!');
    expect(translate('en', celebrationFor(361, 3).cheerKey)).toBe('Shabash!');
    expect(translate('hi', celebrationFor(361, 3).cheerKey)).toBe('शाबाश!');
    expect(translate('en', celebrationFor(1200, 2).cheerKey)).toBe('Ice-cool!');
  });

  test('the cheer meaning is in the player language', () => {
    const party = celebrationFor(500, 3);
    expect(translate('en', party.meaningKey)).toBe('“Wonderful!” in Japanese');
    expect(translate('de', party.meaningKey)).toBe('„Wunderbar!“ auf Japanisch');
  });

  test('the stars line follows the stars', () => {
    expect(translate('en', celebrationFor(5, 3).starsLineKey)).toBe('Perfect! Not a single hint.');
    expect(translate('en', celebrationFor(5, 2).starsLineKey)).toBe('Great job with just one hint!');
    expect(translate('en', celebrationFor(5, 1).starsLineKey)).toBe('Well done, every word found!');
  });

  test('the fun line changes from one level to the next', () => {
    const lines = [61, 62, 63, 64, 65, 66].map(id => celebrationFor(id, 3).funLineKey);
    expect(new Set(lines).size).toBe(6);
    expect(translate('en', celebrationFor(61, 3).funLineKey, { world: 'Paris' })).not.toContain('{world}');
  });

  test('confetti uses the world colours', () => {
    expect(celebrationFor(70, 3).confetti).toContain(WORLDS[1].palette.accent);
  });
});

describe('milestones', () => {
  test('every 10th level gets a ribbon, with rotating lines', () => {
    expect(milestoneFor(10)).toMatchObject({ kind: 'ten', n: 10, badge: '🏅', lineKey: 'result.milestoneLine.1' });
    expect(milestoneFor(20)?.lineKey).toBe('result.milestoneLine.2');
    expect(milestoneFor(70)?.lineKey).toBe('result.milestoneLine.2');
    expect(translate('en', milestoneFor(40)!.titleKey, { n: 40 })).toBe('40 levels done!');
  });

  test('world finales and every 100th level get a bigger celebration', () => {
    expect(milestoneFor(60)).toMatchObject({ kind: 'world', badge: '🎫' });
    expect(milestoneFor(100)).toMatchObject({ kind: 'century', badge: '🏆' });
    expect(milestoneFor(1200)?.kind).toBe('world');
    expect(translate('en', milestoneFor(200)!.titleKey, { n: 200 })).toBe('200 levels! A true word explorer!');
  });

  test('other levels and bad ids have no milestone (negative)', () => {
    for (const id of [0, 1, 9, 11, 15, 99, -10, 10.5, NaN]) expect(milestoneFor(id)).toBeNull();
  });

  test('the Daily Postcard celebrates in the current world, without a milestone', () => {
    const party = celebrationFor(-1, 3, { daily: true, currentLevel: 130 });
    expect(party.world.id).toBe(3);
    expect(party.milestone).toBeNull();
    expect(translate('en', party.funLineKey)).toBe('Today’s postcard is in your album!');
  });
});

describe('congrats texts', () => {
  const keys = [
    ...WORLDS.flatMap(w => [`cheer.${w.id}`, `cheer.${w.id}.meaning`]),
    'result.starsLine.1', 'result.starsLine.2', 'result.starsLine.3',
    'result.milestone.ten', 'result.milestone.century', 'result.milestone.world',
    'result.milestoneLine.century', 'result.funLine.daily',
    ...[1, 2, 3, 4, 5].map(i => `result.milestoneLine.${i}`),
    ...[1, 2, 3, 4, 5, 6].map(i => `result.funLine.${i}`),
  ];
  test.each(SUPPORTED_LANGUAGES.map(l => l.code))('%s has every congrats text', lang => {
    const dict = DICTIONARIES[lang] as Record<string, string>;
    expect(keys.filter(k => !dict[k]?.trim())).toEqual([]);
  });
});
