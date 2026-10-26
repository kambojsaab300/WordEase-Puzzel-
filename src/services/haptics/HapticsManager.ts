import { Platform, Vibration } from 'react-native';
import { useSettings } from '../../store/settings';

// Needs android.permission.VIBRATE in AndroidManifest.xml
class HapticsManagerService {
  private isEnabled(): boolean {
    return useSettings.getState().haptics;
  }

  // Haptics are a nicety: a failure here must never interrupt the game
  private vibrate(pattern: number | number[]) {
    if (!this.isEnabled()) return;
    try {
      Vibration.vibrate(pattern);
    } catch {
      // ignore
    }
  }

  /**
   * Subtle tick when dragging across a new letter in the grid.
   */
  public selectionTick() {
    if (Platform.OS === 'android') this.vibrate(8);
  }

  /**
   * Positive impact when a correct word is found.
   */
  public wordFound() {
    this.vibrate(Platform.OS === 'android' ? [0, 30, 40, 30] : 30);
  }

  /**
   * Standard feedback on buttons and key controls.
   */
  public buttonTap() {
    this.vibrate(12);
  }

  /**
   * Celebratory pattern on level victory.
   */
  public levelComplete() {
    this.vibrate(Platform.OS === 'android' ? [0, 40, 60, 40, 60, 60] : 50);
  }

  /**
   * Gentle buzz on wrong selection (never harsh).
   */
  public errorThud() {
    this.vibrate(18);
  }
}

export const HapticsManager = new HapticsManagerService();
