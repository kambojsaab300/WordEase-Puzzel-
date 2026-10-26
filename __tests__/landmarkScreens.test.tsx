import { act } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { WORLDS } from '../src/game/levels/worlds';
import { PassportStamp } from '../src/ui/PassportStamp';
import { useSettings } from '../src/store/settings';

// Skia draws natively; for these tests a plain stand-in is enough to read the labels
jest.mock('@shopify/react-native-skia', () => {
  const { View } = require('react-native');
  const Stub = ({ children }: { children?: unknown }) => <View>{children as never}</View>;
  return { Canvas: Stub, Group: Stub, Path: Stub };
});

const render = (el: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(el);
  });
  return tree;
};

const labels = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAll(n => typeof n.props.accessibilityLabel === 'string').map(n => n.props.accessibilityLabel as string);

describe('passport stamp landmarks', () => {
  beforeEach(() => act(() => useSettings.setState({ lang: 'en' })));

  test('reads which landmarks of a world are visited', () => {
    const tree = render(<PassportStamp world={WORLDS[1]} collected={false} visited={[true, true, false, false]} />);
    expect(labels(tree)).toContain(
      'Eiffel Tower, visited, Arc de Triomphe, visited, Pont Neuf Bridge, not visited yet, Palace of Versailles, not visited yet',
    );
  });

  test('follows the UI language', () => {
    act(() => useSettings.setState({ lang: 'hi' }));
    const tree = render(<PassportStamp world={WORLDS[6]} collected visited={[true, false, false, false]} />);
    expect(labels(tree).some(l => l.startsWith('ताज महल, देख लिया'))).toBe(true);
  });

  test('without visited data the stamp shows no landmark row (negative)', () => {
    const tree = render(<PassportStamp world={WORLDS[0]} collected />);
    expect(labels(tree).some(l => l.includes('Village Cottage'))).toBe(false);
  });
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// Toast animates with Reanimated (native); here it only needs to show its text
jest.mock('../src/ui/Toast', () => {
  const { Text } = require('react-native');
  return { Toast: ({ toast }: { toast: { text: string } | null }) => (toast ? <Text>{toast.text}</Text> : null) };
});

describe('World Trip screen (simple list)', () => {
  const { GlobeScreen } = require('../src/screens/GlobeScreen');
  const { useProgress } = require('../src/store/progress');

  const open = () => {
    const navigation = { goBack: jest.fn(), popTo: jest.fn() };
    const tree = render(<GlobeScreen navigation={navigation as never} route={{ key: 'g', name: 'Globe' } as never} />);
    return { tree, navigation };
  };
  // One entry per card (the Pressable and its host view carry the same label)
  const cards = (tree: ReactTestRenderer.ReactTestRenderer) =>
    tree.root
      .findAll(n => typeof n.type !== 'string' && /^World \d+,/.test(n.props.accessibilityLabel ?? ''))
      .filter((n, i, all) => all.findIndex(m => m.props.accessibilityLabel === n.props.accessibilityLabel) === i);

  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useSettings.setState({ lang: 'en' });
      useProgress.setState({ currentLevel: 75, stars: { 15: 3, 60: 2 }, lastSeenWorld: 2 });
    });
  });
  afterEach(() => jest.useRealTimers());

  test('shows a translated summary and the world cards, current stop marked', () => {
    const { tree } = open();
    const texts = tree.root.findAllByType(require('react-native').Text).map(n => [n.props.children].flat().join(''));
    expect(texts).toContain('Stop 2 of 20  ·  1 stamps  ·  ★ 5');
    const cardLabels = cards(tree).map(c => c.props.accessibilityLabel as string);
    expect(cardLabels[0]).toMatch(/^World 1, Home Town\. Completed/);
    expect(cardLabels[1]).toMatch(/^World 2, Paris\. You are here/);
    expect(cardLabels[2]).toMatch(/Locked.*Finish Paris to unlock$/);
  });

  test('tapping an open world goes to that world on the route', () => {
    const { tree, navigation } = open();
    act(() => cards(tree)[1].props.onPress());
    expect(navigation.popTo).toHaveBeenCalledWith('Map', { focusWorld: 2 });
  });

  test('a locked world cannot be opened (negative)', () => {
    const { tree, navigation } = open();
    const locked = cards(tree)[2];
    expect(locked.props.accessibilityState).toEqual({ disabled: true });
    expect(locked.props.onPress).toBeUndefined();
    expect(navigation.popTo).not.toHaveBeenCalled();
  });

  test('a newly unlocked world is announced once and marked seen', () => {
    act(() => useProgress.setState({ lastSeenWorld: 1 }));
    const { tree } = open();
    expect(useProgress.getState().lastSeenWorld).toBe(2);
    expect(tree.root.findAllByProps({ children: 'New stop unlocked: Paris!' }).length).toBeGreaterThan(0);
  });
});
