import { STARTING_COINS } from '../game/engine/rewards';
import { useDaily } from './daily';
import { useProgress } from './progress';
import { useQuiz } from './quiz';
import { useWallet } from './wallet';

/** "Reset All Progress" in Settings: levels, stars, coins, daily and quiz streaks. */
export function resetAllProgress() {
  useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1, boughtWorlds: [] });
  // A paid "Remove Ads" is never taken away by a progress reset
  useWallet.setState({ coins: STARTING_COINS });
  useDaily.getState().reset();
  useQuiz.getState().reset();
}
