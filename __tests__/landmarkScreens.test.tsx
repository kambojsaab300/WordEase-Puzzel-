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
