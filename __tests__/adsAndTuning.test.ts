import { getApps } from '@react-native-firebase/app';
import { logEvent } from '@react-native-firebase/analytics';
import { AdsConsent, InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';
import { privacyOptionsRequired, showPrivacyOptions } from '../src/services/ads/admob';
import { targetSeconds } from '../src/game/difficulty/target';
import { AdsManager } from '../src/services/ads/AdsManager';
import { AnalyticsManager } from '../src/services/analytics/AnalyticsManager';
import { useWallet } from '../src/store/wallet';
import { tunedTarget } from '../tools/levelTuning';
import { frustration } from '../tools/live-tune';

describe('AdMob', () => {
  beforeEach(() => useWallet.setState({ coins: 200, adFree: false }));

  test('start asks for consent and loads one interstitial and one rewarded ad', async () => {
    await AdsManager.start();
    expect(InterstitialAd.createForAdRequest).toHaveBeenCalledWith('test-interstitial');
    expect(RewardedAd.createForAdRequest).toHaveBeenCalledWith('test-rewarded');
  });

  test('no reward and an "unavailable" answer while no ad is loaded (negative)', async () => {
    const onRewarded = jest.fn();
    expect(await AdsManager.showRewardedAd(onRewarded)).toBe('unavailable');
    expect(onRewarded).not.toHaveBeenCalled();
  });

  test('an interstitial that is not loaded is not counted as shown (negative)', () => {
    expect(AdsManager.showInterstitial()).toBe(false);
  });

  test('Remove Ads buyers never get an interstitial', () => {
    useWallet.setState({ adFree: true });
    expect(AdsManager.showInterstitial()).toBe(false);
  });
});

describe('Privacy choices', () => {
  test('the Settings button shows only where Google requires it', async () => {
    expect(await privacyOptionsRequired()).toBe(false);
    (AdsConsent.getConsentInfo as jest.Mock).mockResolvedValueOnce({ privacyOptionsRequirementStatus: 'REQUIRED' });
    expect(await privacyOptionsRequired()).toBe(true);
  });

  test('a failing consent call hides the button instead of crashing (negative)', async () => {
    (AdsConsent.getConsentInfo as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    expect(await privacyOptionsRequired()).toBe(false);
    (AdsConsent.showPrivacyOptionsForm as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await expect(showPrivacyOptions()).resolves.toBeUndefined();
  });
});

describe('Firebase sink', () => {
  beforeEach(() => (logEvent as jest.Mock).mockClear());

  test('stays silent until google-services.json gives Firebase an app', () => {
    AnalyticsManager.logLevelStart(5, 1);
    expect(logEvent).not.toHaveBeenCalled();
  });

  test('sends every event once Firebase is set up', () => {
    (getApps as jest.Mock).mockReturnValueOnce([{ name: '[DEFAULT]' }]);
    AnalyticsManager.logLevelQuit(5, 2, 40);
    expect(logEvent).toHaveBeenCalledWith({}, 'level_quit', { level_id: 5, words_found: 2, seconds: 40 });
  });
});

describe('live tuning', () => {
  test('a tuned level aims shorter; others are untouched', () => {
    expect(tunedTarget({ 20: 0.85 }, 20)).toBeCloseTo(targetSeconds(20) * 0.85);
    expect(tunedTarget({ 20: 0.85 }, 21)).toBe(targetSeconds(21));
  });

  test('the level players quit, hint and drag on scores worst', () => {
    const rows = [18, 19, 20, 21, 22, 23].map(level => ({
      level,
      players: 100,
      seconds: Math.round(targetSeconds(level)),
      hintRate: 0.2,
      quitRate: 0.1,
    }));
    rows[2] = { ...rows[2], seconds: Math.round(targetSeconds(20) * 2), hintRate: 0.6, quitRate: 0.4 };
    const scores = frustration(rows, {});
    const worst = [...scores].sort((a, b) => b[1] - a[1])[0];
    expect(worst[0]).toBe(20);
    expect(worst[1]).toBeGreaterThan(1);
  });

  test('levels with too few players are left out (negative)', () => {
    const scores = frustration([{ level: 20, players: 5, seconds: 999, hintRate: 1, quitRate: 1 }], {});
    expect(scores.size).toBe(0);
  });
});
