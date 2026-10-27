import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, LinearGradient, Oval, Path, vec } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Glossy, extruded star from the celebration design, drawn in a 100 x 112 box
function starPath(outer: number, inner: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const k = i % 2 ? inner : outer;
    d += `${i ? 'L' : 'M'}${(50 + k * Math.cos(a)).toFixed(1)} ${(52 + k * Math.sin(a)).toFixed(1)}`;
  }
  return `${d}Z`;
}
const OUTER = starPath(44, 22);
const INNER = starPath(27, 13.5);

const GOLD = { base: '#B25F00', face: ['#FFE45E', '#FFA800'], rim: '#F0A000', bevel: ['#FFF7B8', '#FFC21F'], bevelRim: '#FFB000', shine: 0.8 };
const GREY = { base: '#5E6B76', face: ['#C9D3DB', '#8E9CA8'], rim: '#8794A0', bevel: ['#E4EAEF', '#AAB6C0'], bevelRim: '#9AA7B1', shine: 0.5 };

type Props = {
  on: boolean;
  size: number;
  /** Resting tilt in degrees */
  tilt: number;
  delayMs: number;
  reduceMotion: boolean;
};

export function Star3D({ on, size, tilt, delayMs, reduceMotion }: Props) {
  const look = on ? GOLD : GREY;
  const h = size * 1.12;
  const s = size / 100;

  // 0 -> 1: spins in, overshoots, settles; then a gold ring flashes outward
  const p = useSharedValue(reduceMotion ? 1 : 0);
  const ring = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    p.value = withDelay(delayMs, withTiming(1, { duration: 750 }));
    if (on) ring.value = withDelay(delayMs + 300, withTiming(1, { duration: 700 }));
  }, [delayMs, on, p, reduceMotion, ring]);

  const starStyle = useAnimatedStyle(() => {
    const v = p.value;
    const scale = v < 0.55 ? (1.3 * v) / 0.55 : 1.3 - (0.3 * (v - 0.55)) / 0.45;
    const turn = v < 0.55 ? -220 + (240 * v) / 0.55 : 20 - (20 * (v - 0.55)) / 0.45;
    return {
      opacity: Math.min(1, v * 2),
      transform: [{ perspective: 700 }, { rotate: `${tilt}deg` }, { rotateY: `${turn}deg` }, { scale }],
    };
  });
  const ringStyle = useAnimatedStyle(() => {
    const v = ring.value;
    return {
      opacity: v === 0 || v === 1 ? 0 : v < 0.2 ? (0.95 * v) / 0.2 : 0.95 * (1 - (v - 0.2) / 0.8),
      transform: [{ scale: 0.4 + 1.6 * v }],
    };
  });

  return (
    <View style={{ width: size, height: h }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { left: size * 0.1, right: size * 0.1, top: h * 0.06, bottom: h * 0.16, borderWidth: Math.max(2, size * 0.04) }, ringStyle]}
      />
      <Animated.View style={starStyle}>
        <Canvas style={{ width: size, height: h }}>
          <Group transform={[{ scale: s }]}>
            <Group transform={[{ translateY: 9 }]}>
              <Path path={OUTER} color={look.base} />
              <Path path={OUTER} color={look.base} style="stroke" strokeWidth={9} strokeJoin="round" />
            </Group>
            <Path path={OUTER} color={look.rim} style="stroke" strokeWidth={9} strokeJoin="round" />
            <Path path={OUTER}>
              <LinearGradient start={vec(0, 8)} end={vec(0, 96)} colors={look.face} />
            </Path>
            <Path path={INNER}>
              <LinearGradient start={vec(0, 25)} end={vec(0, 79)} colors={look.bevel} />
            </Path>
            <Path path={INNER} color={look.bevelRim} style="stroke" strokeWidth={2} strokeJoin="round" />
            <Group transform={[{ rotate: (-38 * Math.PI) / 180 }]} origin={vec(36, 33)}>
              <Oval x={29} y={29.4} width={14} height={7.2} color={`rgba(255,255,255,${look.shine})`} />
            </Group>
          </Group>
        </Canvas>
      </Animated.View>
    </View>
  );
}

/** Gold coin with a thick rim, drawn in a 40 x 46 box */
export function CoinIcon({ size }: { size: number }) {
  const s = size / 40;
  return (
    <Canvas style={{ width: size, height: size * 1.15 }}>
      <Group transform={[{ scale: s }]}>
        <Circle cx={20} cy={26} r={18} color="#B25F00" />
        <Circle cx={20} cy={20} r={18}>
          <LinearGradient start={vec(0, 2)} end={vec(0, 38)} colors={['#FFEB82', '#FFB627']} />
        </Circle>
        <Circle cx={20} cy={20} r={18} color="#E8920A" style="stroke" strokeWidth={2} />
        <Circle cx={20} cy={20} r={11.5} color="#D98A00" style="stroke" strokeWidth={3} />
        <Path path="M8.5 15a12.5 12.5 0 0 1 8.5-7" color="rgba(255,255,255,0.85)" style="stroke" strokeWidth={2.6} strokeCap="round" />
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: 'rgba(255,240,170,0.95)',
  },
});
