import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Oval,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { WorldDef, WORLDS } from '../game/levels/worlds';
import { colors, fonts } from '../ui/theme';
import {
  appendArc,
  appendGraticule,
  appendLand,
  clampPitch,
  DEG,
  MAX_PITCH,
  prepareRings,
  project,
  shortestYaw,
} from './globeMath';
import { PlaneIcon } from './PaperPlane';

const RINGS = prepareRings(require('./land110.json') as number[][]);
const WORLD_GEO = WORLDS.map(w => [w.geo.lon, w.geo.lat] as [number, number]);

const PIN = 30;
const TAP_RADIUS = 34;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 2.4;

export type WorldStatus = 'done' | 'current' | 'open' | 'locked';

type Props = {
  width: number;
  height: number;
  statuses: WorldStatus[]; // index = world id - 1
  selectedWorld: number;
  // Bump `seq` to fly the camera to `world`
  focus: { world: number; seq: number };
  unveilWorld: number | null; // a newly unlocked world whose cloud blows away
  reduceMotion: boolean;
  onSelectWorld: (world: number) => void;
};

type Camera = {
  yaw: SharedValue<number>;
  pitch: SharedValue<number>;
  zoom: SharedValue<number>;
  cx: number;
  cy: number;
  baseR: number;
};

const PIN_FILL: Record<WorldStatus, string> = {
  done: colors.primaryOcean,
  current: colors.accentCoral,
  open: colors.primaryOcean,
  locked: '#B9B2A4',
};

function GlobePin({
  world,
  status,
  selected,
  unveil,
  camera,
}: {
  world: WorldDef;
  status: WorldStatus;
  selected: boolean;
  unveil: boolean;
  camera: Camera;
}) {
  const { yaw, pitch, zoom, cx, cy, baseR } = camera;
  const { lon, lat } = world.geo;

  const cloud = useSharedValue(status === 'locked' || unveil ? 1 : 0);
  useEffect(() => {
    if (unveil) cloud.value = withTiming(0, { duration: 1400 });
    else cloud.value = status === 'locked' ? 1 : 0;
  }, [unveil, status, cloud]);

  const pinStyle = useAnimatedStyle(() => {
    const p = project(lon, lat, { yaw: yaw.value, pitch: pitch.value, r: baseR * zoom.value, cx, cy });
    const fade = Math.min(1, Math.max(0, p.depth * 5)); // soft fade at the horizon
    const grow = selected ? 1.3 : 1;
    return {
      opacity: fade,
      transform: [
        { translateX: p.x - PIN / 2 },
        { translateY: p.y - PIN / 2 },
        { scale: grow * (0.7 + 0.3 * fade) },
      ],
    };
  });
  const cloudStyle = useAnimatedStyle(() => ({
    opacity: cloud.value,
    transform: [{ translateX: (1 - cloud.value) * 24 }, { translateY: (1 - cloud.value) * -16 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.pin, pinStyle]}>
      {selected && (
        <View style={styles.labelWrap}>
          <Text style={styles.label} numberOfLines={1}>
            {world.name}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.pinDot,
          { backgroundColor: PIN_FILL[status] },
          selected && styles.pinSelected,
        ]}
      >
        <Text style={[styles.pinText, status === 'locked' && styles.pinTextLocked]}>{world.id}</Text>
      </View>
      {status === 'current' && (
        <View style={styles.plane}>
          <PlaneIcon size={24} />
        </View>
      )}
      <Animated.Text style={[styles.cloud, cloudStyle]}>☁️</Animated.Text>
    </Animated.View>
  );
}

export function Globe3D({
  width,
  height,
  statuses,
  selectedWorld,
  focus,
  unveilWorld,
  reduceMotion,
  onSelectWorld,
}: Props) {
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.max(60, Math.min(width, height) * 0.4);

  const start = WORLD_GEO[focus.world - 1];
  const yaw = useSharedValue(start[0] * DEG);
  const pitch = useSharedValue(clampPitch(start[1] * DEG));
  const zoom = useSharedValue(1);
  const startYaw = useSharedValue(0);
  const startPitch = useSharedValue(0);
  const startZoom = useSharedValue(1);

  // Glide to the requested world the short way round
  useEffect(() => {
    const [lon, lat] = WORLD_GEO[focus.world - 1];
    cancelAnimation(yaw);
    cancelAnimation(pitch);
    const target = { yaw: shortestYaw(yaw.value, lon), pitch: clampPitch(lat * DEG) };
    if (reduceMotion) {
      yaw.value = target.yaw;
      pitch.value = target.pitch;
      return;
    }
    const timing = { duration: 1100, easing: Easing.inOut(Easing.cubic) };
    yaw.value = withTiming(target.yaw, timing);
    pitch.value = withTiming(target.pitch, timing);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only new focus requests move the camera
  }, [focus.seq]);

  // Flight routes between every world reached so far, in trip order
  const reached = statuses.filter(s => s !== 'locked').length;

  const view = () => {
    'worklet';
    return { yaw: yaw.value, pitch: pitch.value, r: baseR * zoom.value, cx, cy };
  };
  const landPath = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    appendLand(p, RINGS, view());
    return p.build();
  });
  const gridPath = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    appendGraticule(p, view());
    return p.build();
  });
  const routePath = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 1; i < reached; i++) appendArc(p, WORLD_GEO[i - 1], WORLD_GEO[i], view());
    return p.build();
  });
  const r = useDerivedValue(() => baseR * zoom.value);
  const atmosphereR = useDerivedValue(() => r.value * 1.09);
  const oceanLight = useDerivedValue(() => vec(cx - r.value * 0.35, cy - r.value * 0.4));
  const oceanSpread = useDerivedValue(() => r.value * 1.6);
  const shadeSpread = useDerivedValue(() => r.value * 1.5);
  const glintCenter = useDerivedValue(() => vec(cx - r.value * 0.4, cy - r.value * 0.45));
  const glintR = useDerivedValue(() => r.value * 0.38);
  const shadowRect = useDerivedValue(() => ({
    x: cx - r.value * 0.8,
    y: cy + r.value * 1.02,
    width: r.value * 1.6,
    height: r.value * 0.18,
  }));

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .onBegin(() => {
        cancelAnimation(yaw);
        cancelAnimation(pitch);
        startYaw.value = yaw.value;
        startPitch.value = pitch.value;
      })
      .onUpdate(e => {
        const radius = baseR * zoom.value;
        yaw.value = startYaw.value - e.translationX / radius;
        pitch.value = clampPitch(startPitch.value + e.translationY / radius);
      })
      .onEnd(e => {
        if (reduceMotion) return;
        const radius = baseR * zoom.value;
        yaw.value = withDecay({ velocity: -e.velocityX / radius, deceleration: 0.996 });
        pitch.value = withDecay({
          velocity: e.velocityY / radius,
          deceleration: 0.996,
          clamp: [-MAX_PITCH, MAX_PITCH],
        });
      });

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        startZoom.value = zoom.value;
      })
      .onUpdate(e => {
        zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom.value * e.scale));
      });

    const tap = Gesture.Tap()
      .maxDistance(12)
      .onEnd((e, success) => {
        if (!success) return;
        let best = -1;
        let bestDist = TAP_RADIUS;
        for (let i = 0; i < WORLD_GEO.length; i++) {
          const p = project(WORLD_GEO[i][0], WORLD_GEO[i][1], view());
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (p.visible && d < bestDist) {
            best = i;
            bestDist = d;
          }
        }
        if (best >= 0) scheduleOnRN(onSelectWorld, best + 1);
      });

    return Gesture.Simultaneous(pinch, Gesture.Race(pan, tap));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [baseR, cx, cy, reduceMotion, onSelectWorld]);

  const camera: Camera = { yaw, pitch, zoom, cx, cy, baseR };
  // Selected pin last so it draws on top
  const order = WORLDS.filter(w => w.id !== selectedWorld).concat(WORLDS[selectedWorld - 1]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width, height }}
        accessible
        accessibilityLabel="3D globe of your World Trip. Drag to spin, pinch to zoom. Use the world cards to choose a stop."
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {/* soft paper shadow under the globe */}
          <Oval rect={shadowRect} color="rgba(31,42,55,0.22)">
            <BlurMask blur={12} style="normal" />
          </Oval>
          {/* atmosphere glow */}
          <Circle cx={cx} cy={cy} r={atmosphereR}>
            <RadialGradient
              c={vec(cx, cy)}
              r={atmosphereR}
              colors={['rgba(150,210,240,0.55)', 'rgba(150,210,240,0)']}
              positions={[0.88, 1]}
            />
          </Circle>
          {/* ocean, lit from the top left */}
          <Circle cx={cx} cy={cy} r={r}>
            <RadialGradient c={oceanLight} r={oceanSpread} colors={['#B5E2F2', '#5FA9CF', '#2A6A90']} />
          </Circle>
          <Path path={gridPath} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.22)" />
          <Group>
            <Path path={landPath} color="#F4E4BF" />
            <Path path={landPath} style="stroke" strokeWidth={1} color="#B99B66" strokeJoin="round" />
          </Group>
          <Path path={routePath} style="stroke" strokeWidth={3} color={colors.accentCoral} strokeCap="round">
            <DashPathEffect intervals={[2, 8]} />
          </Path>
          {/* night side shading for depth */}
          <Circle cx={cx} cy={cy} r={r}>
            <RadialGradient
              c={oceanLight}
              r={shadeSpread}
              colors={['rgba(10,30,50,0)', 'rgba(10,30,50,0.32)']}
              positions={[0.55, 1]}
            />
          </Circle>
          {/* glossy highlight */}
          <Circle c={glintCenter} r={glintR}>
            <RadialGradient c={glintCenter} r={glintR} colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} />
          </Circle>
          <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.5)" />
        </Canvas>

        {order.map(w => (
          <GlobePin
            key={w.id}
            world={w}
            status={statuses[w.id - 1]}
            selected={w.id === selectedWorld}
            unveil={w.id === unveilWorld}
            camera={camera}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PIN,
    height: PIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 4,
  },
  pinSelected: {
    borderWidth: 3,
    borderColor: colors.coinGold,
  },
  pinText: {
    fontSize: 13,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  pinTextLocked: {
    color: '#6E685C',
  },
  plane: {
    position: 'absolute',
    top: -26,
    left: 14,
  },
  cloud: {
    position: 'absolute',
    fontSize: 26,
    top: -8,
  },
  labelWrap: {
    position: 'absolute',
    bottom: PIN + 6,
    width: 170,
    alignItems: 'center',
  },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.bgCream,
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
});
