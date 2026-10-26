import { AdsManager } from '../src/services/ads/AdsManager';
import { useWallet } from '../src/store/wallet';

describe('AdsManager', () => {
  beforeEach(() => {
    useWallet.setState({ coins: 200, adFree: false });
    AdsManager.resetForTesting();
    AdsManager.setConfig({
      firstInterstitialLevel: 4,
      interstitialEveryNLevels: 3,
      minGapSeconds: 90,
    });
  });

  it('never shows ads in levels 1, 2, or 3', () => {
    const now = 100000;
    expect(AdsManager.shouldShowInterstitial(1, now)).toBe(false);
    expect(AdsManager.shouldShowInterstitial(2, now)).toBe(false);
    expect(AdsManager.shouldShowInterstitial(3, now)).toBe(false);
  });

  it('never shows ads after landmark levels (multiples of 15)', () => {
    const now = 200000;
    expect(AdsManager.shouldShowInterstitial(15, now)).toBe(false);
    expect(AdsManager.shouldShowInterstitial(30, now)).toBe(false);
  });

  it('never shows ads when adFree is purchased', () => {
    useWallet.setState({ adFree: true });
    const now = 300000;
    expect(AdsManager.shouldShowInterstitial(4, now)).toBe(false);
    expect(AdsManager.shouldShowInterstitial(6, now)).toBe(false);
  });

  it('respects min gap and frequency after level 4', () => {
    let now = 100000;
    // Level 4: 1st level completed since reset -> false (needs 3)
    expect(AdsManager.shouldShowInterstitial(4, now)).toBe(false);

    // Level 5: 2nd level completed -> false
    expect(AdsManager.shouldShowInterstitial(5, now + 10000)).toBe(false);

    // Level 6: 3rd level completed -> true (no previous ad shown)
    expect(AdsManager.shouldShowInterstitial(6, now + 20000)).toBe(true);

    // Record ad shown at now + 20000
    AdsManager.recordInterstitialShown(now + 20000);

    // Level 7: 1st level -> false
    expect(AdsManager.shouldShowInterstitial(7, now + 30000)).toBe(false);
    // Level 8: 2nd level -> false
    expect(AdsManager.shouldShowInterstitial(8, now + 40000)).toBe(false);
    // Level 9: 3rd level, but gap is only 30s (< 90s) -> false
    expect(AdsManager.shouldShowInterstitial(9, now + 50000)).toBe(false);

    // Same level 9 retried when 95s have elapsed -> true
    expect(AdsManager.shouldShowInterstitial(9, now + 120000)).toBe(true);
  });
});
