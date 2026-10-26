import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../ui/theme';
import { PLANE_PATH } from './landmarks';

const SIZE = 44;

export function PlaneIcon({ size = SIZE }: { size?: number }) {
  const scale = size / 40;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale }]}>
        <Path path={PLANE_PATH} color={colors.white} />
        <Path path={PLANE_PATH} color={colors.ink} style="stroke" strokeWidth={2} strokeJoin="round" />
      </Group>
    </Canvas>
  );
}

// The player's avatar, hovering above the current level
export function PaperPlane({ x, y, reduceMotion }: { x: number; y: number; reduceMotion: boolean }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(bob);
      bob.value = 0;
    } else {
      bob.value = withRepeat(withTiming(-8, { duration: 1200 }), -1, true);
    }
  }, [bob, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.plane, { left: x - SIZE / 2 + 18, top: y - SIZE - 34 }, style]}
    >
      <PlaneIcon />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plane: {
    position: 'absolute',
  },
});
