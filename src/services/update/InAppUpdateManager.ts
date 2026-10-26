import { Platform } from 'react-native';
import type SpInAppUpdatesType from 'sp-react-native-in-app-updates';
import type { StartUpdateOptions } from 'sp-react-native-in-app-updates';

type UpdatesLib = typeof import('sp-react-native-in-app-updates');

// Loaded lazily: the library reads native modules as soon as it is imported, and a missing
// or broken native module must never stop the app from opening (an update check is optional)
function loadUpdatesLib(): UpdatesLib | null {
  try {
    return require('sp-react-native-in-app-updates') as UpdatesLib;
  } catch {
    return null;
  }
}

export interface UpdateCheckResult {
  shouldUpdate: boolean;
  storeVersion?: string;
  error?: string;
}

export class InAppUpdateManagerService {
  private inAppUpdates: SpInAppUpdatesType | null = null;
  private lib: UpdatesLib | null = null;
  private initialized = false;

  // Created on first use (not at import time), so a native failure only disables updates
  private ensureInit(): SpInAppUpdatesType | null {
    if (this.initialized) return this.inAppUpdates;
    this.initialized = true;
    this.lib = loadUpdatesLib();
    try {
      this.inAppUpdates = this.lib ? new this.lib.default(false) : null;
    } catch {
      this.inAppUpdates = null;
    }
    return this.inAppUpdates;
  }

  /**
   * Checks Google Play / App Store for an available update.
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    if (!this.ensureInit() || !this.inAppUpdates) {
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
    if (!this.ensureInit() || !this.inAppUpdates || !this.lib) return false;
    const { IAUUpdateKind } = this.lib;

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
