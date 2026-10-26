import { act } from 'react';
import { StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { Toast } from '../src/ui/Toast';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: { View }, FadeInDown: 'inDown', FadeOutDown: 'outDown', FadeInUp: 'inUp', FadeOutUp: 'outUp' };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));

const box = (el: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(el);
  });
  const view = tree.root.findAll(n => n.props.accessibilityLiveRegion === 'polite')[0];
  return { tree, view, style: StyleSheet.flatten(view.props.style) };
};

describe('Toast placement (regression: praise covered the meaning card at the bottom)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('top placement sits under the top bar, clear of the bottom', () => {
    const { style, view } = box(<Toast toast={{ text: 'Great!' }} placement="top" />);
    expect(style.top).toBe(24 + 56 + 24);
    expect(style.bottom).toBeUndefined();
    expect(view.props.entering).toBe('inUp');
  });

  test('default stays at the bottom for other screens', () => {
    const { style } = box(<Toast toast={{ text: 'Hi' }} />);
    expect(style.bottom).toBe(32);
    expect(style.top).toBeUndefined();
  });

  test('hides itself after 2 seconds; nothing shown without a toast (negative)', () => {
    const { tree } = box(<Toast toast={{ text: 'Bye' }} placement="top" />);
    expect(tree.root.findAllByType(Text)).toHaveLength(1);
    act(() => jest.advanceTimersByTime(2100));
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
    let empty!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      empty = ReactTestRenderer.create(<Toast toast={null} />);
    });
    expect(empty.toJSON()).toBeNull();
  });
});
