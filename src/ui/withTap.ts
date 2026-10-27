import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';

/** Wraps a press handler with the same soft pop and light buzz as IconButton and PrimaryButton */
export function withTap<A extends unknown[]>(handler: (...args: A) => void) {
  return (...args: A) => {
    AudioManager.playButtonTap();
    HapticsManager.buttonTap();
    handler(...args);
  };
}
