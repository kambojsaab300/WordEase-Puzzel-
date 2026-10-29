import { getApps } from '@react-native-firebase/app';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

/**
 * Sends one event to Firebase Analytics. Until android/app/google-services.json is added
 * (docs/DIFFICULTY-FLOW.md, step 6) there is no Firebase app, and this does nothing.
 */
export function sendToFirebase(name: string, params: Record<string, unknown>): void {
  try {
    if (getApps().length === 0) return;
    // Firebase drops undefined values on its own; a failed send must never reach the game
    Promise.resolve(logEvent(getAnalytics(), name as never, params as never)).catch(() => {});
  } catch {
    // Native module missing (tests, or a build without Firebase)
  }
}
