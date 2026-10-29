import { HINT_COST, pickHintWord, strongestMark } from '../src/game/engine/hints';
import {
  levelReward,
  STARTING_COINS,
  TAG_BONUS_COINS,
  WORLD_COMPLETE_COINS,
  worldUnlockCost,
} from '../src/game/engine/rewards';
import { isLevelOpen } from '../src/map/worldProgress';
import { PlacedWord } from '../src/game/types';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';

describe('levelReward', () => {
  test('first win pays full star coins', () => {
    expect(levelReward(5, 3).coins).toBe(20);
    expect(levelReward(5, 1).coins).toBe(10);
  });

  test('replay pays only the improvement', () => {
    expect(levelReward(5, 3, 1).coins).toBe(10);
    expect(levelReward(5, 2, 3)).toMatchObject({ coins: 0, newBest: 3 });
  });

  test('world finale adds the world bonus once', () => {
    // The finale is also Super hard, so its first win carries that bonus too
    expect(levelReward(60, 3)).toMatchObject({
      coins: 20 + WORLD_COMPLETE_COINS + TAG_BONUS_COINS['super-hard'],
      worldCompleted: 1,
    });
    expect(levelReward(60, 3, 3).worldCompleted).toBeNull();
  });
});

describe('hints', () => {
  const words: PlacedWord[] = [
    { w: 'CAFE', start: [0, 0], dir: 'E' },
    { w: 'TEA', start: [1, 0], dir: 'S' },
  ];

  test('hint goes to the first unfound word', () => {
    expect(pickHintWord(words, new Set(['CAFE']), [])?.w).toBe('TEA');
  });

  test('revealed words are skipped, and nothing is left when all are done', () => {
    expect(pickHintWord(words, new Set(), [{ word: 'CAFE', kind: 'reveal' }])?.w).toBe('TEA');
    expect(pickHintWord(words, new Set(['CAFE', 'TEA']), [])).toBeNull();
  });

  test('compass beats spotlight on the same word', () => {
    const marks = [
      { word: 'CAFE', kind: 'spotlight' as const },
      { word: 'CAFE', kind: 'compass' as const },
    ];
    expect(strongestMark(marks, 'CAFE')).toBe('compass');
  });

  test('costs match the flow', () => {
    expect(HINT_COST).toEqual({ spotlight: 25, compass: 40, reveal: 60 });
  });
});

describe('stores', () => {
  beforeEach(() => {
    useWallet.setState({ coins: STARTING_COINS, adFree: false });
    useProgress.setState({ currentLevel: 1, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
  });

  test('new players start with 200 coins', () => {
    expect(useWallet.getState().coins).toBe(200);
  });

  test('spend fails without enough coins and takes nothing', () => {
    expect(useWallet.getState().spend(500)).toBe(false);
    expect(useWallet.getState().coins).toBe(200);
    expect(useWallet.getState().spend(60)).toBe(true);
    expect(useWallet.getState().coins).toBe(140);
  });

  test('completing a level unlocks the next, saves stars and pays coins together', () => {
    useProgress.getState().saveInProgress({ levelId: 1, found: ['HOME'], bonusFound: [], hints: [] });
    useProgress.getState().completeLevel(1, 3);
    const p = useProgress.getState();
    expect(p.currentLevel).toBe(2);
    expect(p.stars[1]).toBe(3);
    expect(p.inProgress).toBeUndefined();
    expect(useWallet.getState().coins).toBe(220);
  });

  test('replaying an old level never moves progress backwards', () => {
    useProgress.setState({ currentLevel: 10 });
    useProgress.getState().completeLevel(3, 2);
    expect(useProgress.getState().currentLevel).toBe(10);
  });
});

describe('buying a world with coins', () => {
  beforeEach(() => {
    useProgress.setState({ currentLevel: 5, stars: {}, inProgress: undefined, boughtWorlds: [] });
    useWallet.setState({ coins: 50000 });
  });

  test('cost climbs with distance', () => {
    expect(worldUnlockCost(2)).toBe(7500);
    expect(worldUnlockCost(20)).toBe(7500 + 18 * 2250);
  });

  test('spends coins and opens only that world, one level at a time', () => {
    expect(useProgress.getState().buyWorld(7)).toBe(true);
    expect(useWallet.getState().coins).toBe(50000 - worldUnlockCost(7));
    const { stars, boughtWorlds } = useProgress.getState();
    expect(isLevelOpen(361, 5, stars, boughtWorlds)).toBe(true);
    expect(isLevelOpen(362, 5, stars, boughtWorlds)).toBe(false);
    expect(isLevelOpen(421, 5, stars, boughtWorlds)).toBe(false);
  });

  test('short on coins or already open: nothing spent', () => {
    useWallet.setState({ coins: 10 });
    expect(useProgress.getState().buyWorld(3)).toBe(false);
    expect(useProgress.getState().buyWorld(1)).toBe(false);
    expect(useWallet.getState().coins).toBe(10);
  });

  test('winning in a bought world keeps the main route, which later skips won levels', () => {
    useProgress.getState().buyWorld(2);
    useProgress.getState().completeLevel(61, 3);
    expect(useProgress.getState().currentLevel).toBe(5);
    useProgress.setState({ currentLevel: 60 });
    useProgress.getState().completeLevel(60, 3);
    expect(useProgress.getState().currentLevel).toBe(62);
  });
});
