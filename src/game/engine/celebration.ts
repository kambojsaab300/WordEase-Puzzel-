import type { TKey } from '../../i18n';
import { LEVELS_PER_WORLD } from '../levels/levelSpec';
import { worldOf, type WorldDef } from '../levels/worlds';
import type { Stars } from './scoring';

export const MILESTONE_EVERY = 10;
export const BIG_MILESTONE_EVERY = 100;
const MILESTONE_LINES = 5;
const FUN_LINES = 6;

export type MilestoneKind = 'ten' | 'century' | 'world';

export type Milestone = {
  kind: MilestoneKind;
  /** Levels finished so far (the level just won) */
  n: number;
  titleKey: TKey;
  lineKey: TKey;
  badge: string;
};

export type Celebration = {
  world: WorldDef;
  /** The world's own cheer in its local language (Magnifique!, Shabash!, ...) */
  cheerKey: TKey;
  /** What the cheer means, in the player's language */
  meaningKey: TKey;
  /** Depends on stars: perfect, one hint, or found them all */
  starsLineKey: TKey;
  /** Rotates from level to level so the screen never feels the same twice */
  funLineKey: TKey;
  milestone: Milestone | null;
  confetti: string[];
};

const GOLD = '#F5B700';
const CORAL = '#F2785C';

/** Milestone ribbon for every 10th level; 100, 200... and world finales get bigger ones. */
export function milestoneFor(levelId: number): Milestone | null {
  if (!Number.isInteger(levelId) || levelId < MILESTONE_EVERY || levelId % MILESTONE_EVERY !== 0) return null;
  const line = ((levelId / MILESTONE_EVERY - 1) % MILESTONE_LINES) + 1;
  if (levelId % LEVELS_PER_WORLD === 0) {
    return { kind: 'world', n: levelId, titleKey: 'result.milestone.world', lineKey: `result.milestoneLine.${line}` as TKey, badge: '🎫' };
  }
  if (levelId % BIG_MILESTONE_EVERY === 0) {
    return { kind: 'century', n: levelId, titleKey: 'result.milestone.century', lineKey: 'result.milestoneLine.century', badge: '🏆' };
  }
  return { kind: 'ten', n: levelId, titleKey: 'result.milestone.ten', lineKey: `result.milestoneLine.${line}` as TKey, badge: '🏅' };
}

/**
 * Everything the Result screen says and shows after a win. The Daily Postcard has no
 * level of its own, so it celebrates in the world the player is travelling through.
 */
export function celebrationFor(levelId: number, stars: Stars, opts: { daily?: boolean; currentLevel?: number } = {}): Celebration {
  const world = worldOf(opts.daily ? Math.max(1, opts.currentLevel ?? 1) : levelId);
  const fun = (((opts.daily ? 0 : levelId) + world.id) % FUN_LINES) + 1;
  return {
    world,
    cheerKey: `cheer.${world.id}` as TKey,
    meaningKey: `cheer.${world.id}.meaning` as TKey,
    starsLineKey: `result.starsLine.${stars}` as TKey,
    funLineKey: (opts.daily ? 'result.funLine.daily' : `result.funLine.${fun}`) as TKey,
    milestone: opts.daily ? null : milestoneFor(levelId),
    confetti: [world.palette.accent, GOLD, world.palette.mid, CORAL, world.palette.near],
  };
}
