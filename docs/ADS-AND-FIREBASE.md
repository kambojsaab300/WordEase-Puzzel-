# Ads (AdMob) and Firebase: where the keys go

Everything is wired. Until you add your own keys the app runs on **Google's test ads**, and analytics stays on the
phone. Nothing breaks without keys.

## 1. AdMob

Packages: `react-native-google-mobile-ads` 17.4.0.

| What | Where | Now |
| --- | --- | --- |
| **App ID** (`ca-app-pub-…~…`) | `app.json` → `react-native-google-mobile-ads` → `android_app_id` | Google's test App ID |
| **Interstitial unit ID** (`ca-app-pub-…/…`) | `src/services/ads/adKeys.ts` → `AD_UNIT_IDS.interstitial` | empty → test ad |
| **Rewarded unit ID** | `src/services/ads/adKeys.ts` → `AD_UNIT_IDS.rewarded` | empty → test ad |
| Banner unit ID (no banner shown yet) | `src/services/ads/adKeys.ts` → `AD_UNIT_IDS.banner` | empty |

Where to get them: AdMob console → Apps → Add app (Android, "WordEase") → App settings shows the App ID. Then Ad
units → create one **Interstitial** and one **Rewarded**.

The App ID must be in `app.json`, not in JS, because Android reads it at build time. A wrong App ID crashes the app
at start, so copy it exactly. Change `app.json` and you need a new APK, not just a JS reload.

**Debug builds always use test ads**, even with real IDs filled in (`admob.ts`, `__DEV__`). Never tap your own live
ads: AdMob can ban the account for it.

### How ads behave (`src/services/ads/`)

- **App start** (`App.tsx` → `AdsManager.start()`): Google's consent form (UMP) appears only where the law needs it
  (EEA/UK). Then the SDK starts and one interstitial and one rewarded ad load in the background. Ads are G-rated
  (family-friendly). With no network or no consent, the game runs without ads.
- **Interstitial**: after a level, on "Next level", only when the old rules allow it. That means not before level 4,
  not after a landmark, every 3 levels, at least 90 s apart, and never for Remove Ads buyers. If none is loaded,
  nothing shows and nothing is counted.
- **Rewarded** (double coins on Result, free coins in the Shop): the reward is given only when the ad is watched to
  the end. If no ad is loaded yet, the player sees "No ad is ready yet. Please try again in a moment." (6 languages).
- **Privacy choices**: Settings shows "🔒 Privacy choices (ads)" only where Google says it is required
  (`privacyOptionsRequired()`). It reopens the consent form. 6 languages.
- `admob.ts` talks to the SDK; `AdsManager.ts` keeps the rules; `adKeys.ts` holds the IDs.

### Still to do before release (T26)

- Test the consent form with an EEA debug geography (`AdsConsent.requestInfoUpdate({ debugGeography: … })`).
- `app-ads.txt` on your developer website, as AdMob asks.

## 2. Firebase Analytics (D6)

Packages: `@react-native-firebase/app` and `@react-native-firebase/analytics` 27.1.0.

1. Firebase console → Add project → Add Android app with package name `com.wordease`. Check it first in
   `android/app/build.gradle` → `applicationId`.
2. Download **`google-services.json`** and put it in **`android/app/`**.
3. Build a new APK. That's it: `android/app/build.gradle` turns the Google Services plugin on only when that file
   exists, and `src/services/analytics/firebaseSink.ts` starts sending.

Without the file the app builds and runs normally; events stay in the phone's memory log.

Events sent (`AnalyticsManager`): `level_start`, `word_found`, `hint_used` (source coins / ad / free),
`level_complete` (stars, hints, seconds), `level_quit` (words found, seconds), and the rest of the list in that file.

For live tuning, also turn on **BigQuery export** (Firebase → Project settings → Integrations → BigQuery). The
query in `docs/DIFFICULTY-FLOW.md` step 6 needs it.

## Not verified yet

Both SDKs need a native build. tsc, lint and all Jest tests pass with mocks, but the first APK with these packages
has not been built. Check on the phone: the app starts, a test interstitial shows after level 6 or so, and the
double-coins test ad pays out.
