import { act } from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useSettings } from '../src/store/settings';

// Only what the Result screen uses: Animated views and chainable entering animations
jest.mock('react-native-reanimated', () => {
  const { Text: RNText, View } = require('react-native');
  const anim: Record<string, unknown> = {};
  for (const m of ['delay', 'springify', 'damping', 'duration']) anim[m] = () => anim;
  return { __esModule: true, default: { View, Text: RNText }, ZoomIn: anim, FadeInDown: anim };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  const Stub = ({ children }: { children?: unknown }) => <View>{children as never}</View>;
  return { Canvas: Stub, Group: Stub, Path: Stub };
});
// confetti is pure decoration; here we only check it is (or is not) mounted
jest.mock('../src/ui/Confetti', () => ({ Confetti: () => null }));
// the animated burst, 3D stars and painting postcard are decoration too
jest.mock('../src/ui/celebration/Backdrop', () => ({ Backdrop: () => null }));
jest.mock('../src/ui/celebration/Star3D', () => ({ Star3D: () => null, CoinIcon: () => null }));
jest.mock('../src/ui/celebration/CelebrationPostcard', () => ({ CelebrationPostcard: () => null }));

const { ResultScreen } = require('../src/screens/ResultScreen');
const { Confetti } = require('../src/ui/Confetti');

const show = (params: Record<string, unknown>) => {
  const navigation = { popTo: jest.fn() };
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <ResultScreen navigation={navigation as never} route={{ key: 'r', name: 'Result', params } as never} />,
    );
  });
  const texts = tree.root.findAllByType(Text).map(n => [n.props.children].flat().join(''));
  return { tree, texts, navigation };
};

describe('Result screen congrats', () => {
  beforeEach(() => act(() => useSettings.setState({ lang: 'en', reduceMotion: false })));

  test('a Paris level shows the Paris cheer, its meaning, stars line and confetti', () => {
    const { tree, texts } = show({ levelId: 62, stars: 3, coins: 20, worldCompleted: null });
    expect(texts).toEqual(expect.arrayContaining(['Magnifique!', '“Wonderful!” in French', 'Perfect! Not a single hint.', 'Level 62 · Paris', '+20']));
    expect(tree.root.findAllByType(Confetti)).toHaveLength(1);
  });

  test('level 70 adds the milestone ribbon', () => {
    const { texts } = show({ levelId: 70, stars: 2, coins: 15, worldCompleted: null });
    expect(texts).toEqual(expect.arrayContaining(['🏅', '70 levels done!', 'Your trip is going wonderfully.']));
  });

  test('ordinary level has no ribbon; Reduce Motion turns confetti off (negative)', () => {
    act(() => useSettings.setState({ reduceMotion: true }));
    const { tree, texts } = show({ levelId: 63, stars: 1, coins: 10, worldCompleted: null });
    expect(texts.some(t => t.includes('levels done'))).toBe(false);
    expect(tree.root.findAllByType(Confetti)).toHaveLength(0);
  });

  test('a first win on a Hard level shows its bonus line', () => {
    const { texts } = show({ levelId: 75, stars: 3, coins: 35, worldCompleted: null, tagBonus: 15 });
    expect(texts).toEqual(expect.arrayContaining(['🔥 Hard level bonus +15', '+35']));
  });

  test('three stars with the free nudge do not claim "not a single hint"', () => {
    const { texts } = show({ levelId: 63, stars: 3, coins: 20, worldCompleted: null, freeNudge: true });
    expect(texts).toContain('Three stars! The free hint does not count.');
    expect(texts).not.toContain('Perfect! Not a single hint.');
  });

  test('a replay of a Hard level has no bonus line (negative)', () => {
    const { texts } = show({ levelId: 75, stars: 3, coins: 0, worldCompleted: null, tagBonus: 0 });
    expect(texts.some(t => t.includes('bonus'))).toBe(false);
  });

  test('in Hindi the cheer and lines are Hindi', () => {
    act(() => useSettings.setState({ lang: 'hi' }));
    const { texts } = show({ levelId: 365, stars: 3, coins: 20, worldCompleted: null });
    expect(texts).toEqual(expect.arrayContaining(['शाबाश!', 'परफ़ेक्ट! एक भी संकेत नहीं।']));
  });
});
