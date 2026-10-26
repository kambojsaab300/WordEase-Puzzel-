import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { mulberry32 } from '../game/generator/prng';

type Props = {
  colors: string[];
  /** Same seed, same burst: each level gets its own but stable pattern */
  seed: number;
  count?: number;
};

type Piece = { x: number; w: number; h: number; color: string; delay: number; duration: number; sway: number; spin: number };

function Bit({ piece, height }: { piece: Piece; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) }));
  }, [t, piece]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateY: -40 + t.value * (height + 80) },
      { translateX: Math.sin(t.value * Math.PI * 3) * piece.sway },
      { rotate: `${t.value * piece.spin}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[styles.bit, { left: piece.x, width: piece.w, height: piece.h, backgroundColor: piece.color }, style]}
    />
  );
}

// Paper confetti falling once over the screen (decorative, never blocks taps)
export const Confetti = memo(function ConfettiView({ colors, seed, count = 36 }: Props) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: rng() * (width - 12),
      w: 8 + rng() * 8,
      h: 10 + rng() * 10,
      color: colors[i % colors.length],
      delay: rng() * 600,
      duration: 2200 + rng() * 1400,
      sway: 10 + rng() * 24,
      spin: (rng() < 0.5 ? -1 : 1) * (180 + rng() * 540),
    }));
  }, [seed, count, width, colors]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => (
        <Bit key={i} piece={p} height={height} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  bit: {
    position: 'absolute',
    top: 0,
    borderRadius: 3,
  },
});
