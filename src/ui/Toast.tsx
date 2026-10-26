import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, sizes } from './theme';

const VISIBLE_MS = 2000;
// Below the screen's top bar (56dp buttons + padding), clear of the safe area
const TOP_OFFSET = sizes.touchTarget + 24;

type Props = {
  // Pass a new object each time so the same text can show twice
  toast: { text: string } | null;
  /** 'top' keeps the bottom free, e.g. for the meaning card on the Level screen */
  placement?: 'top' | 'bottom';
};

export function Toast({ toast, placement = 'bottom' }: Props) {
  const [current, setCurrent] = useState(toast);
  const insets = useSafeAreaInsets();
  const top = placement === 'top';

  useEffect(() => {
    setCurrent(toast);
    if (!toast) return;
    const timer = setTimeout(() => setCurrent(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!current) return null;

  return (
    <Animated.View
      entering={top ? FadeInUp : FadeInDown}
      exiting={top ? FadeOutUp : FadeOutDown}
      style={[styles.toast, top ? { top: insets.top + TOP_OFFSET } : styles.bottom]}
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Text style={styles.text}>{current.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    elevation: 8,
  },
  bottom: {
    bottom: 32,
  },
  text: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.uiBold,
    textAlign: 'center',
  },
});
