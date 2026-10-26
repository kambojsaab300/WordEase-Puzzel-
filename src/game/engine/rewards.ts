import { LEVELS_PER_WORLD } from '../levels/levelSpec';
import { coinsFor, Stars } from './scoring';

export const STARTING_COINS = 200;
export const BONUS_WORD_COINS = 1;
export const WORLD_COMPLETE_COINS = 150;

export type LevelReward = {
  coins: number;
  newBest: Stars;
  worldCompleted: number | null;
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
  };
}
