import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, fonts } from './theme';

const VISIBLE_MS = 2000;

type Props = {
  // Pass a new object each time so the same text can show twice
  toast: { text: string } | null;
};

export function Toast({ toast }: Props) {
  const [current, setCurrent] = useState(toast);

  useEffect(() => {
    setCurrent(toast);
    if (!toast) return;
    const timer = setTimeout(() => setCurrent(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!current) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={styles.toast}
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
    bottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.uiBold,
    textAlign: 'center',
  },
});
