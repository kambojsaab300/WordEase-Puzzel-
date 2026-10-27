import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Mask,
  Path,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// Ocean burst behind the celebration: radial glow, slowly turning golden rays and twinkling sparkles.
// All sizes come from the 390-wide design artboard and scale with the screen.
const RAY = 'rgba(255,228,120,0.30)';
const SPARK_PATH = 'M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6Z';
const SPARKS = [
  { x: 34, y: 196, delay: 0.2 },
  { x: 330, y: 170, delay: 1.1 },
  { x: 300, y: 330, delay: 0.6 },
  { x: 40, y: 430, delay: 1.7 },
  { x: 336, y: 500, delay: 0.9 },
];
const TWINKLE_MS = 2400;

type Props = {
  width: number;
  height: number;
  /** y of the burst centre, behind the stars */
  centerY: number;
  reduceMotion: boolean;
};

function raysPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 24; i++) {
    const a0 = ((i * 15 - 90) * Math.PI) / 180;
    const a1 = ((i * 15 + 7.5 - 90) * Math.PI) / 180;
    d += `M${cx} ${cy}L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}Z`;
  }
  return d;
}

export function Backdrop({ width, height, centerY, reduceMotion }: Props) {
  const u = width / 390;
  const cx = width / 2;
  const rayR = 490 * u;
  const rays = useMemo(() => raysPath(cx, centerY, rayR), [cx, centerY, rayR]);

  const spin = useSharedValue(0);
  const twinkle = useSharedValue(reduceMotion ? 0.5 : 0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(spin);
      cancelAnimation(twinkle);
      return;
    }
    spin.value = withRepeat(withTiming(Math.PI * 2, { duration: 50000, easing: Easing.linear }), -1, false);
    twinkle.value = withRepeat(withTiming(1, { duration: TWINKLE_MS, easing: Easing.linear }), -1, false);
  }, [reduceMotion, spin, twinkle]);
  const rayTurn = useDerivedValue(() => [{ rotate: spin.value }]);

  const far = Math.hypot(width / 2, Math.max(centerY, height - centerY));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient
          c={vec(cx, centerY)}
          r={far}
          colors={['#33B2D6', '#0E6E8C', '#07344B']}
          positions={[0, 0.4, 1]}
        />
      </Rect>
      <Mask
        mask={
          <Circle cx={cx} cy={centerY} r={rayR}>
            <RadialGradient
              c={vec(cx, centerY)}
              r={rayR}
              colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
              positions={[0, 0.08, 0.62]}
            />
          </Circle>
        }
      >
        <Group transform={rayTurn} origin={vec(cx, centerY)}>
          <Path path={rays} color={RAY} />
        </Group>
      </Mask>
      <Circle cx={cx} cy={centerY} r={260 * u}>
        <RadialGradient
          c={vec(cx, centerY)}
          r={260 * u}
          colors={['rgba(255,240,170,0.55)', 'rgba(255,240,170,0)']}
          positions={[0, 0.68]}
        />
      </Circle>
      {SPARKS.map(s => (
        <Sparkle key={s.x} x={s.x * u} y={s.y * u} size={22 * u} phase={s.delay / (TWINKLE_MS / 1000)} clock={twinkle} />
      ))}
    </Canvas>
  );
}

function Sparkle({ x, y, size, phase, clock }: { x: number; y: number; size: number; phase: number; clock: SharedValue<number> }) {
  const amount = useDerivedValue(() => Math.sin(Math.PI * ((clock.value + 1 - phase) % 1)));
  // centre of the sparkle, then turn and grow around it
  const transform = useDerivedValue(() => [
    { translateX: x + size / 2 },
    { translateY: y + size / 2 },
    { rotate: (Math.PI / 4) * amount.value },
    { scale: Math.max(0.001, (size / 24) * amount.value) },
  ]);
  return (
    <Group transform={transform} opacity={amount}>
      <Path path={SPARK_PATH} color="#FFF6C2" transform={[{ translateX: -12 }, { translateY: -12 }]} />
    </Group>
  );
}
