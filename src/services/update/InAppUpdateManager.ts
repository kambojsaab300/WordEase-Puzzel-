import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

export interface UpdateCheckResult {
  shouldUpdate: boolean;
  storeVersion?: string;
  error?: string;
}

export class InAppUpdateManagerService {
  private inAppUpdates: SpInAppUpdates | null = null;

  constructor() {
    try {
      this.inAppUpdates = new SpInAppUpdates(false);
    } catch {
      this.inAppUpdates = null;
    }
  }

  /**
   * Checks Google Play / App Store for an available update.
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    if (!this.inAppUpdates) {
      return { shouldUpdate: false, error: 'InAppUpdates not initialized' };
    }
    try {
      const result = await this.inAppUpdates.checkNeedsUpdate();
      return {
        shouldUpdate: Boolean(result?.shouldUpdate),
        storeVersion: result?.storeVersion,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { shouldUpdate: false, error: message };
    }
  }

  /**
   * Triggers the in-app update popup.
   * On Android:
   *  - forceUpdate = true: shows Immediate update (blocks screen until updated).
   *  - forceUpdate = false: shows Flexible update (downloads in background).
   * On iOS: opens the App Store page.
   */
  async startUpdate(forceUpdate = false): Promise<boolean> {
    if (!this.inAppUpdates) return false;

    try {
      const updateOptions: StartUpdateOptions = Platform.select({
        android: {
          updateType: forceUpdate ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE,
        },
        default: {},
      });

      await this.inAppUpdates.startUpdate(updateOptions);
      return true;
    } catch (err) {
      console.warn('[InAppUpdateManager] Failed to trigger update:', err);
      return false;
    }
  }

  /**
   * Checks if an update is available and triggers the update dialog automatically.
   */
  async checkAndPrompt(forceUpdate = false): Promise<boolean> {
    const check = await this.checkForUpdate();
    if (check.shouldUpdate) {
      return await this.startUpdate(forceUpdate);
    }
    return false;
  }
}

export const InAppUpdateManager = new InAppUpdateManagerService();
