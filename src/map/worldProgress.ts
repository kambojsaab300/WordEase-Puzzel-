import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLD_COUNT, WORLDS } from '../game/levels/worlds';

export type WorldStatus = 'done' | 'current' | 'open' | 'locked';
export type WorldStats = { levelsDone: number; stars: number; total: number };

// currentLevel = highest unlocked level; a world is done once its finale has stars
export function worldStatuses(currentLevel: number, stars: Record<number, number>): WorldStatus[] {
  const unlocked = unlockedWorldOf(currentLevel);
  return WORLDS.map(w => {
    if (stars[w.id * LEVELS_PER_WORLD]) return 'done';
    if (w.id === unlocked) return 'current';
    return w.id < unlocked ? 'open' : 'locked';
  });
}

export function unlockedWorldOf(currentLevel: number): number {
  return Math.min(WORLD_COUNT, Math.max(1, Math.ceil(currentLevel / LEVELS_PER_WORLD)));
}

export function worldStats(world: number, stars: Record<number, number>): WorldStats {
  const first = (world - 1) * LEVELS_PER_WORLD + 1;
  let levelsDone = 0;
  let total = 0;
  for (let id = first; id < first + LEVELS_PER_WORLD; id++) {
    if (stars[id]) {
      levelsDone += 1;
      total += stars[id];
    }
  }
  return { levelsDone, stars: total, total: LEVELS_PER_WORLD };
}
