/**
 * AdMob ad unit IDs. Paste your own from the AdMob console (Apps → WordEase → Ad units).
 *
 * While a field is empty, or in a debug build, Google's test ads are used. Test ads are
 * safe to tap; never tap your own live ads, AdMob can ban the account for it.
 *
 * The AdMob **App ID** (ca-app-pub-…~…) does not go here: it goes in app.json under
 * "react-native-google-mobile-ads" → "android_app_id", because Android reads it at build
 * time. app.json ships with Google's test App ID until you replace it.
 */
export const AD_UNIT_IDS = {
  /** ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN */
  interstitial: '',
  rewarded: '',
  /** Not shown anywhere yet; kept for the map banner (T27) */
  banner: '',
};

/** Ad requests for a family-friendly word game: no adult ad content. */
export const MAX_AD_CONTENT_RATING = 'G' as const;
