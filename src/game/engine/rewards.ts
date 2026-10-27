import { isLandmark, LEVELS_PER_WORLD } from '../levels/levelSpec';
import { coinsFor, Stars } from './scoring';

export const STARTING_COINS = 200;
export const BONUS_WORD_COINS = 1;
export const WORLD_COMPLETE_COINS = 150;

// Skipping ahead to a country costs about six worlds of earnings, and more the further away it is
export const WORLD_UNLOCK_BASE = 7500;
export const WORLD_UNLOCK_STEP = 2250;


export function worldUnlockCost(world: number): number {
  return WORLD_UNLOCK_BASE + Math.max(0, world - 2) * WORLD_UNLOCK_STEP;
}

export type LevelReward = {
  coins: number;
  newBest: Stars;
  worldCompleted: number | null;
  /** First win of a landmark level (15, 30, 45, 60 in each world): a new sight for the passport */
  landmarkVisited: boolean;
};

/**
 * First win pays the full star coins; a replay pays only the improvement,
 * so replaying easy levels is not a coin farm.
 */
export function levelReward(levelId: number, stars: Stars, previous?: Stars): LevelReward {
  const best = Math.max(stars, previous ?? 0) as Stars;
  const starCoins = coinsFor(best) - (previous ? coinsFor(previous) : 0);
  const isFinale = levelId % LEVELS_PER_WORLD === 0;
  const worldCompleted = isFinale && !previous ? levelId / LEVELS_PER_WORLD : null;

  return {
    coins: Math.max(0, starCoins) + (worldCompleted ? WORLD_COMPLETE_COINS : 0),
    newBest: best,
    worldCompleted,
    landmarkVisited: isLandmark(levelId) && !previous,
  };
}
