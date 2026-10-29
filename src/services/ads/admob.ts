import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from './adKeys';

// Debug builds and empty IDs always get Google's test ads (adKeys.ts)
const unitId = (id: string, test: string) => (__DEV__ || !id ? test : id);

let started = false;
let canRequest = false;

type Slot<T> = { ad: T | null; ready: boolean; loading: boolean };
const interstitial: Slot<InterstitialAd> = { ad: null, ready: false, loading: false };
const rewarded: Slot<RewardedAd> = { ad: null, ready: false, loading: false };

function loadInterstitial() {
  if (!canRequest || interstitial.loading) return;
  const ad = InterstitialAd.createForAdRequest(unitId(AD_UNIT_IDS.interstitial, TestIds.INTERSTITIAL));
  interstitial.loading = true;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitial.ready = true;
    interstitial.loading = false;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitial.ready = false;
    interstitial.loading = false; // the next show() asks again
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    interstitial.ready = false;
    loadInterstitial();
  });
  interstitial.ad = ad;
  ad.load();
}

function loadRewarded() {
  if (!canRequest || rewarded.loading) return;
  const ad = RewardedAd.createForAdRequest(unitId(AD_UNIT_IDS.rewarded, TestIds.REWARDED));
  rewarded.loading = true;
  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewarded.ready = true;
    rewarded.loading = false;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewarded.ready = false;
    rewarded.loading = false;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    rewarded.ready = false;
    loadRewarded();
  });
  rewarded.ad = ad;
  ad.load();
}

/**
 * Consent first (Google's UMP form shows only where the law needs it, e.g. EEA/UK),
 * then the SDK, then the first interstitial and rewarded ad are loaded in the background.
 * Never throws: with no network or no consent the game simply runs without ads.
 */
export async function startAds(): Promise<void> {
  if (started) return;
  started = true;
  try {
    const consent = await AdsConsent.gatherConsent();
    canRequest = consent.canRequestAds;
    if (!canRequest) return;
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.G });
    await mobileAds().initialize();
    loadInterstitial();
    loadRewarded();
  } catch {
    started = false; // try again on the next app start
  }
}

/** Shows the loaded interstitial; false (and a fresh load) when none is ready. */
export function showInterstitialAd(): boolean {
  const { ad, ready } = interstitial;
  if (!ad || !ready) {
    loadInterstitial();
    return false;
  }
  interstitial.ready = false;
  ad.show().catch(() => loadInterstitial());
  return true;
}

/** 'earned' only if the player watched to the reward; 'unavailable' when no ad was loaded yet. */
export type RewardedResult = 'earned' | 'skipped' | 'unavailable';

export function showRewardedAd(): Promise<RewardedResult> {
  const { ad, ready } = rewarded;
  if (!ad || !ready) {
    loadRewarded();
    return Promise.resolve('unavailable');
  }
  rewarded.ready = false;
  return new Promise(resolve => {
    let earned = false;
    const offEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      offEarned();
      offClosed();
      resolve(earned ? 'earned' : 'skipped');
    });
    ad.show().catch(() => {
      offEarned();
      offClosed();
      loadRewarded();
      resolve('unavailable');
    });
  });
}

/** True where Google requires a "Privacy choices" entry (e.g. EEA/UK); Settings shows the button then. */
export async function privacyOptionsRequired(): Promise<boolean> {
  try {
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    return false;
  }
}

/** Settings "Privacy choices": Google requires a way to change consent where the form applied. */
export async function showPrivacyOptions(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {
    // Not required in this region, or offline
  }
}
