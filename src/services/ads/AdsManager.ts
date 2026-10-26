import { useWallet } from '../../store/wallet';

export type AdsConfig = {
  firstInterstitialLevel: number;
  interstitialEveryNLevels: number;
  minGapSeconds: number;
  dailyRewardedHintCap: number;
  dailyFreeCoinsCap: number;
};

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  firstInterstitialLevel: 4,
  interstitialEveryNLevels: 3,
  minGapSeconds: 90,
  dailyRewardedHintCap: 10,
  dailyFreeCoinsCap: 5,
};

class AdsManagerService {
  private config: AdsConfig = DEFAULT_ADS_CONFIG;
  private lastFullscreenTime = 0;
  private levelsSinceAd = 0;
  private freeCoinsClaimedToday = 0;
  private lastDayKey = '';

  constructor(config?: Partial<AdsConfig>) {
    if (config) {
      this.config = { ...DEFAULT_ADS_CONFIG, ...config };
    }
  }

  public setConfig(config: Partial<AdsConfig>) {
    this.config = { ...this.config, ...config };
  }

  public resetForTesting() {
    this.lastFullscreenTime = 0;
    this.levelsSinceAd = 0;
    this.freeCoinsClaimedToday = 0;
    this.lastDayKey = '';
  }

  public isAdFree(): boolean {
    return Boolean(useWallet.getState().adFree);
  }

  /**
   * Evaluates whether an interstitial ad should be displayed upon finishing a level.
   * AdMob compliance rules:
   * 1. If user purchased Remove Ads -> NEVER show.
   * 2. Levels 1-3 -> NEVER show.
   * 3. Landmark levels (every 15 levels) -> NEVER show immediately after milestone.
   * 4. Must respect frequency (every N levels) and minimum gap (90s).
   */
  public shouldShowInterstitial(levelId: number, currentTimeMs = Date.now()): boolean {
    if (this.isAdFree()) return false;
    if (levelId < this.config.firstInterstitialLevel) return false;
    if (levelId % 15 === 0) return false; // Landmark milestone breather

    this.levelsSinceAd += 1;

    if (this.levelsSinceAd < this.config.interstitialEveryNLevels) {
      return false;
    }

    if (this.lastFullscreenTime > 0) {
      const elapsedSeconds = (currentTimeMs - this.lastFullscreenTime) / 1000;
      if (elapsedSeconds < this.config.minGapSeconds) {
        return false;
      }
    }

    return true;
  }

  public recordInterstitialShown(currentTimeMs = Date.now()) {
    this.lastFullscreenTime = currentTimeMs;
    this.levelsSinceAd = 0;
  }

  /**
   * Simulates/triggers rewarded ad for double coins or free hints.
   * Invokes onRewarded callback when ad completes.
   */
  public async showRewardedAd(onRewarded: () => void): Promise<boolean> {
    onRewarded();
    return true;
  }

  public canClaimFreeCoins(todayKey: string): boolean {
    if (this.lastDayKey !== todayKey) {
      this.lastDayKey = todayKey;
      this.freeCoinsClaimedToday = 0;
    }
    return this.freeCoinsClaimedToday < this.config.dailyFreeCoinsCap;
  }

  public recordFreeCoinsClaimed(todayKey: string): number {
    if (this.lastDayKey !== todayKey) {
      this.lastDayKey = todayKey;
      this.freeCoinsClaimedToday = 0;
    }
    this.freeCoinsClaimedToday += 1;
    return this.config.dailyFreeCoinsCap - this.freeCoinsClaimedToday;
  }
}

export const AdsManager = new AdsManagerService();
