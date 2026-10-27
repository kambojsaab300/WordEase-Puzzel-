import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Group, Oval, Path, Rect } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../ui/theme';

// Drawn in a 60 x 92 box, shown at 48 x 74
const W = 48;
const H = 74;

const ENVELOPE = 'M30 2C14 2 4 14 4 28c0 14 12 24 20 34h12c8-10 20-20 20-34C56 14 46 2 30 2Z';
const STRIPE = 'M30 2C22 2 17 14 17 28c0 14 5 24 9 34h8c4-10 9-20 9-34C43 14 38 2 30 2Z';
const CENTRE = 'M30 2C27 2 25 14 25 28c0 14 2 24 3 34h4c1-10 3-20 3-34C35 14 33 2 30 2Z';
const ROPES = 'M24 62L25 74M36 62L35 74';

// The player's hot-air balloon, bobbing above the current level
export function Balloon({ x, y, nodeRadius, reduceMotion }: { x: number; y: number; nodeRadius: number; reduceMotion: boolean }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(bob);
      bob.value = 0;
    } else {
      bob.value = withRepeat(withTiming(-7, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [bob, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.balloon, { left: x - 12, top: y - nodeRadius - H - 2 }, style]}
    >
      <Canvas style={{ width: W, height: H }}>
        <Group transform={[{ scale: W / 60 }]}>
          <Path path={ENVELOPE} color={colors.accentCoral} />
          <Path path={STRIPE} color="#F5C842" />
          <Path path={CENTRE} color={colors.primaryOcean} />
          <Oval x={12} y={13} width={8} height={18} color="rgba(255,255,255,0.35)" />
          <Path path={ROPES} color="#5A4030" style="stroke" strokeWidth={1.6} />
          <Rect x={23} y={73} width={14} height={12} color="#A7774E" />
          <Rect x={23} y={73} width={14} height={3} color="#8C5F3A" />
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  balloon: {
    position: 'absolute',
  },
});
