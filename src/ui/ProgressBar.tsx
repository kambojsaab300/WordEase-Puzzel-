import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from './theme';

// value: 0..1
export function ProgressBar({ value }: { value: number }) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value)), { duration: 300 });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#DCCBAA',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.okGreen,
  },
});
