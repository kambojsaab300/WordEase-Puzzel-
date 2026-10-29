import { act } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { levelReward, TAG_BONUS_COINS, WORLD_COMPLETE_COINS } from '../src/game/engine/rewards';
import { DAILY_LEVEL_ID } from '../src/game/levels/levelRepo';
import { levelTag } from '../src/game/levels/levelSpec';
import { LevelNode } from '../src/map/LevelNode';
import { useSettings } from '../src/store/settings';

// Only what LevelNode uses; the pulse ring is off here anyway (reduceMotion)
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    cancelAnimation: () => {},
    Easing: { out: () => () => 0, ease: () => 0 },
    useAnimatedStyle: () => ({}),
    useSharedValue: (value: number) => ({ value }),
    withRepeat: (anim: unknown) => anim,
    withTiming: (value: unknown) => value,
  };
});

const render = (el: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(el);
  });
  return tree;
};

const node = (levelId: number) =>
  render(
    <LevelNode
      levelId={levelId}
      state="locked"
      stars={0}
      landmark={false}
      worldEnd={false}
      tag={levelTag(levelId)}
      x={0}
      y={0}
      reduceMotion
      onPress={() => {}}
    />,
  );

const label = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.find(n => n.props.accessibilityRole === 'button').props.accessibilityLabel as string;

describe('level tags', () => {
  test.each([
    [15, 'hard'],
    [45, 'hard'],
    [60, 'super-hard'],
    [1200, 'super-hard'],
    [14, null],
    [16, null],
    [61, null],
    [DAILY_LEVEL_ID, null],
  ])('level %i is tagged %s', (id, tag) => {
    expect(levelTag(id)).toBe(tag);
  });

  test('the first win of a Hard level pays the bonus, a replay does not', () => {
    expect(levelReward(15, 3)).toMatchObject({ coins: 20 + TAG_BONUS_COINS.hard, tagBonus: TAG_BONUS_COINS.hard });
    expect(levelReward(15, 3, 2)).toMatchObject({ coins: 5, tagBonus: 0 });
  });

  test('a Super hard finale pays its bonus on top of the world bonus', () => {
    const reward = levelReward(60, 2);
    expect(reward.coins).toBe(15 + WORLD_COMPLETE_COINS + TAG_BONUS_COINS['super-hard']);
    expect(reward.tagBonus).toBe(TAG_BONUS_COINS['super-hard']);
  });

  test('untagged levels pay no bonus', () => {
    expect(levelReward(14, 3)).toMatchObject({ coins: 20, tagBonus: 0 });
  });
});

describe('map node badge', () => {
  beforeEach(() => act(() => useSettings.setState({ lang: 'en' })));

  test('TalkBack reads the tag with the node', () => {
    expect(label(node(15))).toBe('Level 15, locked, Hard level');
    expect(label(node(60))).toBe('Level 60, locked, Super hard level');
  });

  test('an untagged node has no badge', () => {
    expect(label(node(14))).toBe('Level 14, locked');
    const flames = (tree: ReactTestRenderer.ReactTestRenderer) =>
      tree.root.findAllByType(Text).filter(n => n.props.children === '🔥');
    expect(flames(node(14))).toHaveLength(0);
    expect(flames(node(15))).toHaveLength(1);
  });

  test('the tag is translated', () => {
    act(() => useSettings.setState({ lang: 'hi' }));
    expect(label(node(60))).toContain('बहुत कठिन लेवल');
  });
});
