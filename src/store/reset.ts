import { STARTING_COINS } from '../game/engine/rewards';
import { useDaily } from './daily';
import { useProgress } from './progress';
import { useWallet } from './wallet';

/** "Reset All Progress" in Settings: levels, stars, coins and daily streak. */
export function resetAllProgress() {
  useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
  // A paid "Remove Ads" is never taken away by a progress reset
  useWallet.setState({ coins: STARTING_COINS });
  useDaily.getState().reset();
}
