import { useAdState } from '../src/store/adState';

describe('AdState Persistence Store', () => {
  beforeEach(() => {
    useAdState.getState().resetForTesting();
  });

  it('tracks interstitial levels and resets on show', () => {
    expect(useAdState.getState().levelsSinceInterstitial).toBe(0);
    useAdState.getState().incrementLevelsSinceAd();
    useAdState.getState().incrementLevelsSinceAd();
    expect(useAdState.getState().levelsSinceInterstitial).toBe(2);

    useAdState.getState().recordInterstitialShown(123456);
    expect(useAdState.getState().levelsSinceInterstitial).toBe(0);
    expect(useAdState.getState().lastFullscreenAt).toBe(123456);
  });

  it('tracks daily free coins and resets when date changes', () => {
    const day1 = '2026-10-26';
    const day2 = '2026-10-27';

    expect(useAdState.getState().canClaimFreeCoins(day1, 5)).toBe(true);
    for (let i = 0; i < 5; i++) {
      useAdState.getState().recordFreeCoinsClaimed(day1);
    }
    expect(useAdState.getState().canClaimFreeCoins(day1, 5)).toBe(false);

    // Next day should automatically allow claims again
    expect(useAdState.getState().canClaimFreeCoins(day2, 5)).toBe(true);
    expect(useAdState.getState().freeCoinsClaimedToday).toBe(0);
  });
});
