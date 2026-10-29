import { useAdState } from '../../store/adState';
import { useWallet } from '../../store/wallet';
import { RewardedResult, showInterstitialAd, showRewardedAd, startAds } from './admob';

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

  constructor(config?: Partial<AdsConfig>) {
    if (config) {
      this.config = { ...DEFAULT_ADS_CONFIG, ...config };
    }
  }

  public setConfig(config: Partial<AdsConfig>) {
    this.config = { ...this.config, ...config };
  }

  public resetForTesting() {
    useAdState.getState().resetForTesting();
  }

  public isAdFree(): boolean {
    return Boolean(useWallet.getState().adFree);
  }

  /** App start: consent, SDK and first loads. Remove Ads buyers still get rewarded ads they ask for. */
  public start(): Promise<void> {
    return startAds();
  }

  /** Shows an interstitial if one is loaded and records it for the frequency rules. */
  public showInterstitial(currentTimeMs = Date.now()): boolean {
    if (this.isAdFree() || !showInterstitialAd()) return false;
    this.recordInterstitialShown(currentTimeMs);
    return true;
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

    const levelsSinceAd = useAdState.getState().incrementLevelsSinceAd();

    if (levelsSinceAd < this.config.interstitialEveryNLevels) {
      return false;
    }

    const lastTime = useAdState.getState().lastFullscreenAt;
    if (lastTime > 0) {
      const elapsedSeconds = (currentTimeMs - lastTime) / 1000;
      if (elapsedSeconds < this.config.minGapSeconds) {
        return false;
      }
    }

    return true;
  }

  public recordInterstitialShown(currentTimeMs = Date.now()) {
    useAdState.getState().recordInterstitialShown(currentTimeMs);
  }

  /**
   * Rewarded ad for double coins or free coins. `onRewarded` runs only when the player
   * watched to the reward. 'unavailable' means no ad was loaded yet: tell the player.
   */
  public async showRewardedAd(onRewarded: () => void): Promise<RewardedResult> {
    const result = await showRewardedAd();
    if (result === 'earned') onRewarded();
    return result;
  }

  public canClaimFreeCoins(todayKey: string): boolean {
    return useAdState.getState().canClaimFreeCoins(todayKey, this.config.dailyFreeCoinsCap);
  }

  public recordFreeCoinsClaimed(todayKey: string): number {
    const claimed = useAdState.getState().recordFreeCoinsClaimed(todayKey);
    return Math.max(0, this.config.dailyFreeCoinsCap - claimed);
  }

  public canWatchRewardedHint(todayKey: string): boolean {
    return useAdState.getState().canWatchRewardedHint(todayKey, this.config.dailyRewardedHintCap);
  }

  public recordRewardedHint(todayKey: string) {
    useAdState.getState().recordRewardedHint(todayKey);
  }
}

export const AdsManager = new AdsManagerService();
