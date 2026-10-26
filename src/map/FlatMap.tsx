import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
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
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { WorldDef, WORLDS } from '../game/levels/worlds';
import { useT, worldKey } from '../i18n';
import { colors, fonts } from '../ui/theme';
import { BorderView, loadCountries } from './borderView';
import { clampCamera, FOCUS_ZOOM, focusCamera, homeCamera, MapCamera, onScreen, pinchCamera } from './mapZoom';
import { PlaneIcon } from './PaperPlane';
import { graticuleSvg, MAP_ASPECT, outlineSvg, ringsToSvg, routeSvg, toMap } from './projection';
import type { WorldStatus } from './worldProgress';

// Soft paper colours for the 7 country colour groups (neighbours never share one)
const COUNTRY_COLORS = ['#F7C59F', '#B5D99C', '#9AD0EC', '#F4E285', '#E5B3D6', '#C7B8EA', '#A8E0C8'];
const PIN = 30;
const TAIL = 12;
const MARKER_H = PIN + TAIL;
const HEAD_ABOVE_TIP = MARKER_H - PIN / 2;
const TAP_RADIUS = 30;

const PIN_FILL: Record<WorldStatus, string> = {
  done: colors.primaryOcean,
  current: colors.accentCoral,
  open: colors.primaryOcean,
  locked: '#B9B2A4',
};

type Props = {
  width: number;
  height: number;
  statuses: WorldStatus[]; // index = world id - 1
  selectedWorld: number;
  // Bump `seq` to move the camera to `world`
  focus: { world: number; seq: number };
  unveilWorld: number | null; // a newly unlocked world whose cloud blows away
  borderView: BorderView;
  reduceMotion: boolean;
  onSelectWorld: (world: number) => void;
};

type Cam = {
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
};

function MapPin({
  world,
  point,
  status,
  selected,
  unveil,
  cam,
}: {
  world: WorldDef;
  point: [number, number];
  status: WorldStatus;
  selected: boolean;
  unveil: boolean;
  cam: Cam;
}) {
  const t = useT();
  const cloud = useSharedValue(status === 'locked' || unveil ? 1 : 0);
  useEffect(() => {
    if (unveil) cloud.value = withTiming(0, { duration: 1400 });
    else cloud.value = status === 'locked' ? 1 : 0;
  }, [unveil, status, cloud]);

  const [px, py] = point;
  const pinStyle = useAnimatedStyle(() => {
    const p = onScreen(px, py, { scale: cam.scale.value, tx: cam.tx.value, ty: cam.ty.value });
    return {
      transform: [
        { translateX: p.x - PIN / 2 },
        { translateY: p.y - MARKER_H },
        { scale: selected ? 1.25 : 1 },
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
            {t(worldKey(world.id))}
          </Text>
        </View>
      )}
      <View style={styles.groundShadow} />
      <View style={[styles.tail, { backgroundColor: PIN_FILL[status] }]} />
      <View style={[styles.pinDot, { backgroundColor: PIN_FILL[status] }, selected && styles.pinSelected]}>
        <View style={styles.shine} />
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

export function FlatMap({
  width,
  height,
  statuses,
  selectedWorld,
  focus,
  unveilWorld,
  borderView,
  reduceMotion,
  onSelectWorld,
}: Props) {
  const t = useT();
  const mapW = width;
  const mapH = width / MAP_ASPECT;
  const box = useMemo(() => ({ viewW: width, viewH: height, mapW, mapH }), [width, height, mapW, mapH]);

  // The map never moves under the player's feet, so every shape is built once
  const shapes = useMemo(() => {
    const data = loadCountries(borderView);
    const make = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
    return {
      data,
      outline: make(outlineSvg(mapW)),
      grid: make(graticuleSvg(mapW)),
      countries: data.colors.map(rings => make(ringsToSvg(rings, mapW))),
    };
  }, [borderView, mapW]);

  const points = useMemo(() => WORLDS.map(w => toMap(w.geo.lon, w.geo.lat, mapW)), [mapW]);

  const reached = useMemo(() => {
    const isos = new Set(
      statuses.flatMap((st, i) => (st === 'locked' ? [] : [shapes.data.worlds[String(i + 1)]])),
    );
    const rings = [...isos].flatMap(iso => shapes.data.worldRings[iso] ?? []);
    const count = statuses.filter(st => st !== 'locked').length;
    return {
      countries: Skia.Path.MakeFromSVGString(ringsToSvg(rings, mapW)) ?? Skia.Path.Make(),
      route: Skia.Path.MakeFromSVGString(routeSvg(points.slice(0, count))) ?? Skia.Path.Make(),
    };
  }, [statuses, shapes, points, mapW]);

  const start = homeCamera(box);
  const scale = useSharedValue(start.scale);
  const tx = useSharedValue(start.tx);
  const ty = useSharedValue(start.ty);
  const pinchStart = useSharedValue<MapCamera>(start);
  const focalStart = useSharedValue({ x: 0, y: 0 });
  const panStart = useSharedValue({ x: 0, y: 0 });

  const camera = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }]);
  // Lines keep the same thickness on screen at any zoom
  const borderWidth = useDerivedValue(() => 0.8 / scale.value);
  const goldWidth = useDerivedValue(() => 1.8 / scale.value);
  const routeWidth = useDerivedValue(() => 2.5 / scale.value);
  const shadowShift = useDerivedValue(() => [{ translateX: 1 / scale.value }, { translateY: 1.8 / scale.value }]);

  const moveTo = (c: MapCamera, animate: boolean) => {
    cancelAnimation(scale);
    cancelAnimation(tx);
    cancelAnimation(ty);
    const timing = { duration: animate && !reduceMotion ? 900 : 0, easing: Easing.inOut(Easing.cubic) };
    scale.value = withTiming(c.scale, timing);
    tx.value = withTiming(c.tx, timing);
    ty.value = withTiming(c.ty, timing);
  };

  // A chosen world: zoom in on it (the very first view shows the whole map)
  useEffect(() => {
    const [px, py] = points[focus.world - 1];
    moveTo(focus.seq === 0 ? homeCamera(box) : focusCamera(px, py, FOCUS_ZOOM, box), focus.seq !== 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only new focus requests move the camera
  }, [focus.seq, box]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(8)
      .maxPointers(1)
      .onStart(() => {
        cancelAnimation(tx);
        cancelAnimation(ty);
        panStart.value = { x: tx.value, y: ty.value };
      })
      .onUpdate(e => {
        const c = clampCamera(
          { scale: scale.value, tx: panStart.value.x + e.translationX, ty: panStart.value.y + e.translationY },
          box,
        );
        tx.value = c.tx;
        ty.value = c.ty;
      });

    const pinch = Gesture.Pinch()
      .onStart(e => {
        pinchStart.value = { scale: scale.value, tx: tx.value, ty: ty.value };
        focalStart.value = { x: e.focalX, y: e.focalY };
      })
      .onUpdate(e => {
        const c = pinchCamera(pinchStart.value, focalStart.value, e.scale, { x: e.focalX, y: e.focalY }, box);
        scale.value = c.scale;
        tx.value = c.tx;
        ty.value = c.ty;
      });

    const tap = Gesture.Tap()
      .maxDistance(10)
      .onEnd((e, success) => {
        if (!success) return;
        let best = -1;
        let bestDist = TAP_RADIUS;
        for (let i = 0; i < points.length; i++) {
          const p = onScreen(points[i][0], points[i][1], { scale: scale.value, tx: tx.value, ty: ty.value });
          const d = Math.hypot(p.x - e.x, p.y - HEAD_ABOVE_TIP - e.y);
          if (d < bestDist) {
            best = i;
            bestDist = d;
          }
        }
        if (best >= 0) scheduleOnRN(onSelectWorld, best + 1);
      });

    return Gesture.Race(tap, Gesture.Simultaneous(pinch, pan));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable
  }, [box, points, onSelectWorld]);

  const cam: Cam = { scale, tx, ty };
  // Selected pin last so it draws on top
  const order = WORLDS.filter(w => w.id !== selectedWorld).concat(WORLDS[selectedWorld - 1]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.frame, { width, height }]} accessible accessibilityLabel={t('globe.a11y')}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={camera}>
            {/* sea inside the Earth's oval, lighter towards the poles like an old paper map */}
            <Path path={shapes.outline}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, mapH)}
                colors={['#CBEAF5', '#7FC3E0', '#7FC3E0', '#CBEAF5']}
                positions={[0, 0.3, 0.7, 1]}
              />
            </Path>
            <Path path={shapes.grid} style="stroke" strokeWidth={borderWidth} color="rgba(255,255,255,0.55)" />
            {shapes.countries.map((p, i) => (
              <Path key={i} path={p} color={COUNTRY_COLORS[i]} />
            ))}
            {shapes.countries.map((p, i) => (
              <Path key={`b${i}`} path={p} style="stroke" strokeWidth={borderWidth} color="rgba(255,255,255,0.95)" />
            ))}
            {/* countries reached so far: lifted with a shadow and a gold edge */}
            <Group transform={shadowShift}>
              <Path path={reached.countries} color="rgba(120,70,0,0.35)" />
            </Group>
            <Path path={reached.countries} color="rgba(255,236,170,0.55)" />
            <Path path={reached.countries} style="stroke" strokeWidth={goldWidth} color={colors.coinGold} />
            <Path path={reached.route} style="stroke" strokeWidth={routeWidth} color={colors.accentCoral} strokeCap="round">
              <DashPathEffect intervals={[2, 6]} />
            </Path>
            <Path path={shapes.outline} style="stroke" strokeWidth={goldWidth} color="#1B5C86" />
          </Group>
        </Canvas>

        {order.map(w => (
          <MapPin
            key={w.id}
            world={w}
            point={points[w.id - 1]}
            status={statuses[w.id - 1]}
            selected={w.id === selectedWorld}
            unveil={w.id === unveilWorld}
            cam={cam}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PIN,
    height: MARKER_H,
    alignItems: 'center',
    transformOrigin: 'center bottom',
  },
  groundShadow: {
    position: 'absolute',
    bottom: -3,
    width: 18,
    height: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tail: {
    position: 'absolute',
    bottom: 3,
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
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
  shine: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 9,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
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
    top: -6,
  },
  labelWrap: {
    position: 'absolute',
    bottom: MARKER_H + 4,
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
