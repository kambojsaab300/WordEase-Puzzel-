import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CLOUD_PATH } from './landmarks';

const CLOUDS = [
  { top: 0.12, scale: 1.3, duration: 70000, delay: 0 },
  { top: 0.45, scale: 0.9, duration: 90000, delay: 0.45 },
  { top: 0.75, scale: 1.1, duration: 80000, delay: 0.75 },
];
const PARALLAX = 0.12;

function Cloud({
  top,
  scale,
  duration,
  delay,
  scrollY,
  reduceMotion,
}: (typeof CLOUDS)[number] & { scrollY: SharedValue<number>; reduceMotion: boolean }) {
  const { width, height } = useWindowDimensions();
  const cloudW = 90 * scale;
  const span = width + cloudW * 2;
  const drift = useSharedValue(delay);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(drift);
      drift.value = delay;
      return;
    }
    drift.value = delay;
    drift.value = withRepeat(
      withTiming(delay + 1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [drift, delay, duration, reduceMotion]);

  const style = useAnimatedStyle(() => {
    const x = ((drift.value % 1) * span) - cloudW;
    const parallax = reduceMotion ? 0 : scrollY.value * PARALLAX;
    const y = ((((top * height + parallax) % height) + height) % height) - 40;
    return { transform: [{ translateX: x }, { translateY: y }] };
  });

  return (
    <Animated.View style={[styles.cloud, style]}>
      <Canvas style={{ width: cloudW, height: 50 * scale }}>
        <Group transform={[{ scale }]}>
          <Path path={CLOUD_PATH} color="rgba(255,255,255,0.85)" />
        </Group>
      </Canvas>
    </Animated.View>
  );
}

// Slow clouds drifting over the map; they move with scroll at a slower rate (parallax)
export function MapClouds({ scrollY, reduceMotion }: { scrollY: SharedValue<number>; reduceMotion: boolean }) {
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CLOUDS.map((c, i) => (
        <Cloud key={i} {...c} scrollY={scrollY} reduceMotion={reduceMotion} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
