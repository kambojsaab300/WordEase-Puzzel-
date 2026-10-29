import { DAILY_LEVEL_ID, getLevel } from '../src/game/levels/levelRepo';
import { getDailyLevel } from '../src/game/levels/dailyLevel';
import { HINT_COST, pickHintWord, strongestMark } from '../src/game/engine/hints';
import { levelReward } from '../src/game/engine/rewards';
import { lineBetween, pointToCell } from '../src/game/engine/selection';
import { PlacedWord } from '../src/game/types';
import { AdsManager } from '../src/services/ads/AdsManager';
import { getTodayKey, getYesterdayKey, INITIAL_DAILY, useDaily, weekKeyOf } from '../src/store/daily';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';
import { useSettings } from '../src/store/settings';
import { translate } from '../src/i18n';

describe('Comprehensive Positive & Negative Edge Testing', () => {
  beforeEach(() => {
    useWallet.setState({ coins: 200, adFree: false });
    useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
    useDaily.setState({ ...INITIAL_DAILY, done: {}, streak: 0, freezes: 1 });
    useSettings.setState({ lang: 'en', haptics: true, sfx: 0.8, music: 0.5 });
    AdsManager.resetForTesting();
  });

  describe('Wallet Positive & Negative Boundaries', () => {
    it('prevents spending more coins than available (Negative)', () => {
      useWallet.setState({ coins: 30 });
      const success = useWallet.getState().spend(50);
      expect(success).toBe(false);
      expect(useWallet.getState().coins).toBe(30); // Unchanged
    });

    it('allows spending exact available balance down to 0 (Boundary)', () => {
      useWallet.setState({ coins: 40 });
      const success = useWallet.getState().spend(40);
      expect(success).toBe(true);
      expect(useWallet.getState().coins).toBe(0);
    });

    it('rejects spending 1 coin when balance is 0 (Negative)', () => {
      useWallet.setState({ coins: 0 });
      expect(useWallet.getState().spend(1)).toBe(false);
      expect(useWallet.getState().coins).toBe(0);
    });

    it('adds coins correctly without floating point errors (Positive)', () => {
      useWallet.setState({ coins: 100 });
      useWallet.getState().add(50);
      useWallet.getState().add(1);
      expect(useWallet.getState().coins).toBe(151);
    });
  });

  describe('Hints Engine Boundaries & Negatives', () => {
    const testWords: PlacedWord[] = [
      { w: 'LION', start: [0, 0], dir: 'E' },
      { w: 'TIGER', start: [1, 0], dir: 'E' },
    ];

    it('returns hint target when unrevealed words exist (Positive)', () => {
      const target = pickHintWord(testWords, new Set(), []);
      expect(target).toBeDefined();
      expect(['LION', 'TIGER']).toContain(target?.w);
    });

    it('returns null when all words are already found (Negative)', () => {
      const target = pickHintWord(testWords, new Set(['LION', 'TIGER']), []);
      expect(target).toBeNull();
    });

    it('identifies strongest hint mark correctly', () => {
      expect(strongestMark([{ word: 'LION', kind: 'spotlight' }], 'LION')).toBe('spotlight');
      expect(
        strongestMark(
          [
            { word: 'LION', kind: 'spotlight' },
            { word: 'LION', kind: 'compass' },
          ],
          'LION',
        ),
      ).toBe('compass');
      expect(strongestMark([], 'LION')).toBeNull();
    });

    it('ensures hint costs follow design spec', () => {
      expect(HINT_COST.spotlight).toBe(25);
      expect(HINT_COST.compass).toBe(40);
      expect(HINT_COST.reveal).toBe(60);
    });
  });

  describe('Level Generator & Classic Play Beyond 1,200', () => {
    it('loads boundary levels without crashing (1, 15, 60, 61, 1200, 1201)', () => {
      const boundaryIds = [1, 15, 60, 61, 700, 1200, 1201, 1205];
      for (const id of boundaryIds) {
        const level = getLevel(id);
        expect(level).toBeDefined();
        expect(level.id).toBe(id);
        expect(level.words.length).toBeGreaterThan(0);
        expect(level.grid.length).toBe(level.rows);
        expect(level.grid[0].length).toBe(level.cols);
      }
    });

    it('returns Daily level when DAILY_LEVEL_ID is passed', () => {
      const daily = getLevel(DAILY_LEVEL_ID);
      expect(daily).toBeDefined();
      expect(daily.id).toBe(DAILY_LEVEL_ID);
      expect(daily.theme).toContain('Daily ·');
    });

    it('generates 30 arbitrary daily puzzle dates without any failures', () => {
      const dates = [
        '2026-01-01', '2026-02-14', '2026-03-31', '2026-04-15', '2026-05-20',
        '2026-06-30', '2026-07-04', '2026-08-15', '2026-09-22', '2026-10-26',
        '2026-11-11', '2026-12-25', '2026-12-31', '2027-01-01', '2028-02-29',
      ];
      for (const d of dates) {
        expect(() => {
          const lvl = getDailyLevel(d)!;
          expect(lvl).not.toBeNull();
          expect(lvl.words.length).toBeGreaterThanOrEqual(4);
          expect(lvl.grid.length).toBe(8);
        }).not.toThrow();
      }
    });
  });

  describe('Daily Streak & Freeze Mechanics', () => {
    it('increments streak on consecutive days (Positive)', () => {
      const yesterday = getYesterdayKey();
      const today = getTodayKey();

      // Simulate yesterday was done
      useDaily.setState({ streak: 2, lastDay: yesterday, done: { [yesterday]: true } });

      const res = useDaily.getState().completeDaily(today);
      expect(res.alreadyDone).toBe(false);
      expect(res.streak).toBe(3);
      expect(res.coins).toBe(100); // 3-day milestone = 100 coins
    });

    it('awards 300 coins on Day 7 milestone', () => {
      const yesterday = getYesterdayKey();
      const today = getTodayKey();

      useDaily.setState({ streak: 6, lastDay: yesterday, done: { [yesterday]: true } });

      const res = useDaily.getState().completeDaily(today);
      expect(res.streak).toBe(7);
      expect(res.coins).toBe(300); // 7-day milestone = 300 coins
    });

    it('uses streak freeze when exactly one day is skipped and freezes > 0 (Boundary)', () => {
      // Played Mon 2026-10-19, missed Tue, plays Wed: same week, so no refill
      useDaily.setState({ streak: 4, lastDay: '2026-10-19', freezes: 1, freezeWeek: '', done: {} });
      useDaily.setState({ freezeWeek: weekKeyOf('2026-10-21') });

      const res = useDaily.getState().completeDaily('2026-10-21');
      expect(res.streak).toBe(5); // Preserved
      expect(useDaily.getState().freezes).toBe(0); // Freeze consumed
    });

    it('resets streak to 1 when day skipped and 0 freezes left (Negative)', () => {
      const today = getTodayKey();
      useDaily.setState({ streak: 10, lastDay: '2026-01-01', freezes: 0, done: {} });

      const res = useDaily.getState().completeDaily(today);
      expect(res.streak).toBe(1); // Reset
    });
  });

  describe('Selection & Touch Math Edge Cases', () => {
    it('handles negative coordinates gracefully by clamping', () => {
      const cell = pointToCell(-100, -50, 50, 8, 8);
      expect(cell).toEqual([0, 0]);
    });

    it('handles excessive coordinates by clamping to max bounds', () => {
      const cell = pointToCell(9999, 9999, 50, 8, 8);
      expect(cell).toEqual([7, 7]);
    });

    it('handles non-straight line selections in lineBetween (Negative)', () => {
      // Knight move (1 right, 2 down) is not a straight 8-direction line
      expect(lineBetween([0, 0], [2, 1])).toBeNull();
      // Random irregular jump
      expect(lineBetween([1, 1], [4, 2])).toBeNull();
    });

    it('handles backward and diagonal lineBetween correctly', () => {
      expect(lineBetween([3, 3], [1, 1])).toEqual([
        [3, 3],
        [2, 2],
        [1, 1],
      ]);
      expect(lineBetween([0, 4], [0, 1])).toEqual([
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
      ]);
    });
  });

  describe('Level Rewards & Replay Logic', () => {
    it('awards full coins on first 3-star victory', () => {
      const r = levelReward(1, 3, undefined);
      expect(r.coins).toBe(20);
      expect(r.newBest).toBe(3);
    });

    it('awards delta coins when beating an old 1-star score with 3-stars', () => {
      // 1 star = 10 coins, 3 stars = 20 coins -> delta = 10
      const r = levelReward(1, 3, 1);
      expect(r.coins).toBe(10);
      expect(r.newBest).toBe(3);
    });

    it('awards 0 coins when replaying with same or worse stars (Negative)', () => {
      const r = levelReward(1, 2, 3); // Won with 2 stars, already had 3 stars
      expect(r.coins).toBe(0);
      expect(r.newBest).toBe(3); // Keeps best
    });

    it('detects world completion on 60th level and awards +150 bonus coins', () => {
      const r = levelReward(60, 3, undefined);
      expect(r.worldCompleted).toBe(1);
      expect(r.coins).toBe(20 + 150 + 30); // stars + world bonus + Super hard first win
    });
  });

  describe('AdMob Frequency & Policy Constraints', () => {
    it('strictly enforces 5 free coin claim limit per day', () => {
      const today = getTodayKey();
      for (let i = 0; i < 5; i++) {
        expect(AdsManager.canClaimFreeCoins(today)).toBe(true);
        AdsManager.recordFreeCoinsClaimed(today);
      }
      // 6th claim must be blocked
      expect(AdsManager.canClaimFreeCoins(today)).toBe(false);
    });

    it('never shows interstitials if adFree is active', () => {
      useWallet.setState({ adFree: true });
      expect(AdsManager.shouldShowInterstitial(10)).toBe(false);
      expect(AdsManager.shouldShowInterstitial(25)).toBe(false);
    });
  });

  describe('Localization Edge Fallbacks', () => {
    it('falls back to English for an unknown language code', () => {
      expect(translate('xx', 'common.continue')).toBe('Continue');
      expect(translate('zz', 'app.name')).toBe('WordEase');
    });
  });
});
