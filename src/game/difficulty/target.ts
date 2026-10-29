import { DIP_ROLES, LANDMARK_EVERY, levelInWorld, levelRole, Role } from '../levels/levelSpec';

// Seconds on the search bot's clock (DEFAULT_PACE). Phone play data (D4) will rescale the pace;
// the shape of this curve is what matters. Fitted to what the level bands can actually reach,
// with the last worlds about 15% shorter than before (hard levels should stay short).
const START = 21;
const END = 360;
const CURVE_LEVELS = 1200;
// Below 1 the curve climbs faster early and flattens later
const GROWTH = 0.8;

/** How each role sits against the base curve: dips below, peaks above, the finale highest. */
const RHYTHM: Record<Role, number> = {
  'warm-up': 0.75,
  intro: 0.8,
  breather: 0.8,
  normal: 1,
  hard: 1.15,
  peak: 1.3,
  finale: 1.45,
};

// Normal levels climb through the world (6 → 44), so the drop after every peak is felt
const CLIMB_FROM = 0.9;
const CLIMB_TO = 1.1;

/** Typical solve time a level should have, by the bot's clock. */
export function targetSeconds(levelId: number): number {
  const progress = Math.min(1, (levelId - 1) / (CURVE_LEVELS - 1));
  const base = START + (END - START) * progress ** GROWTH;
  const role = levelRole(levelId);
  const climb = role === 'normal' ? CLIMB_FROM + ((CLIMB_TO - CLIMB_FROM) * (levelInWorld(levelId) - 6)) / 38 : 1;
  return base * RHYTHM[role] * climb;
}

/** A level's time must stay under `below` and over `above` (either may be missing). */
export type Bounds = { below?: number; above?: number };

/**
 * The sawtooth as hard rules, given the times of the levels before this one:
 * a dip is easier than the last level that was not a dip, a landmark is harder than
 * every level since the previous landmark, and the finale is the hardest of its world.
 */
export function rhythmBounds(levelId: number, secondsOf: (id: number) => number | undefined): Bounds {
  const role = levelRole(levelId);
  const inWorld = levelInWorld(levelId);

  if (DIP_ROLES.includes(role)) {
    let id = levelId - 1;
    while (id >= 1 && DIP_ROLES.includes(levelRole(id))) id--;
    return { below: secondsOf(id) };
  }
  if (role === 'peak' || role === 'finale') {
    const from = role === 'finale' ? levelId - inWorld + 1 : levelId - LANDMARK_EVERY + 1;
    const before: number[] = [];
    for (let id = from; id < levelId; id++) {
      const s = secondsOf(id);
      if (s !== undefined) before.push(s);
    }
    return { above: before.length > 0 ? Math.max(...before) : undefined };
  }
  return {};
}

export function withinBounds(seconds: number, { below, above }: Bounds): boolean {
  return (below === undefined || seconds < below) && (above === undefined || seconds > above);
}
