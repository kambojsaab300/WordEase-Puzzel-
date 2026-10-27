import { memo, useMemo, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  ColorMatrix,
  DashPathEffect,
  Group,
  Oval,
  Paint,
  Path,
  Rect,
} from '@shopify/react-native-skia';
import { POSTCARD_ASSETS, type WorldId } from '../assets/postcards';
import { mulberry32 } from '../game/generator/prng';
import { isLandmark, LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLDS, type WorldPalette } from '../game/levels/worlds';
import { colors, fonts } from '../ui/theme';
import { Balloon } from './Balloon';
import { landmarkAt, landmarkKey } from './landmarkPlan';
import { levelX, levelYInSegment, Segment, SEGMENT_GAP, SEGMENT_HEIGHT, SEGMENTS_PER_WORLD } from './layout';
import { LevelNode, NodeState } from './LevelNode';
import { isLevelOpen } from './worldProgress';
import { useProgress } from '../store/progress';
import { useT, worldKey } from '../i18n';

// Paper-cutout map from the "WordEase Level Map" design, painted in each world's own palette.
// Everything above the current level is a pencil-grey sketch that gets coloured as the player climbs.
const INK_SHADOW = 'rgba(60,40,20,0.14)';
const TUFT = 'rgba(60,40,20,0.2)';
const ROAD = '#FBF4E6';
const ROAD_LINE = '#E2D2B2';
const EXTRUDE_STEPS = [5, 4, 3, 2, 1];
const LANDMARK_SIZE = 120;
const CARD_W = 240;
const CURRENT_R = 37; // half of LevelNode's current size

// Pencil sketch: greyscale, a touch lighter and flatter
const GREY = [
  0.2, 0.67, 0.07, 0, 0.05,
  0.2, 0.67, 0.07, 0, 0.05,
  0.2, 0.67, 0.07, 0, 0.05,
  0, 0, 0, 1, 0,
];

type Props = {
  segment: Segment;
  width: number;
  currentLevel: number;
  stars: Record<number, number>;
  reduceMotion: boolean;
  onPressLevel: (levelId: number) => void;
};

type Blob = { cx: number; cy: number; r: number };
type Tree = { x: number; y: number; s: number; pine: boolean };
type Feature = { x: number; y: number; pond: boolean };

// Scenery is seeded per segment, so the map looks the same every time
function buildScenery(segment: Segment, width: number) {
  const rng = mulberry32(segment.index * 9973 + 7);
  const bushes: Blob[] = [];
  const trees: Tree[] = [];
  const features: Feature[] = [];
  let tufts = '';

  // Leafy patches hugging both edges
  for (let k = 0; k < 4; k++) {
    const left = k % 2 === 0;
    const x = left ? -20 + rng() * 50 : width - 30 + rng() * 50;
    const y = 120 + (k + rng() * 0.6) * ((SEGMENT_HEIGHT - 300) / 4);
    const r = 36 + rng() * 30;
    for (const [dx, dy, f] of [[0, 0, 1], [0.8, 0.25, 0.8], [-0.7, 0.35, 0.75], [0.1, -0.6, 0.7]]) {
      bushes.push({ cx: x + r * dx, cy: y + r * dy, r: r * f });
    }
  }

  // Grass tufts scattered over the ground
  for (let k = 0; k < 22; k++) {
    const x = Math.round(rng() * width);
    const y = Math.round(40 + rng() * (SEGMENT_HEIGHT - 80));
    tufts += `M${x} ${y}l-3 -7M${x} ${y}l0 -9M${x} ${y}l3 -7`;
  }

  // A pond or a cottage beside the road's widest bend, away from the landmark at the top
  let best = segment.firstLevel + 2;
  for (let id = segment.firstLevel + 2; id <= segment.lastLevel - 4; id++) {
    if (Math.abs(Math.sin(id * 0.85)) > Math.abs(Math.sin(best * 0.85))) best = id;
  }
  const side = Math.sin(best * 0.85) > 0 ? -1 : 1;
  features.push({
    x: width / 2 + side * width * 0.3,
    y: levelYInSegment(best, segment.index),
    pond: segment.index % 2 === 0,
  });

  // Trees along the edges, kept clear of the pond or cottage
  for (let y = 140; y < SEGMENT_HEIGHT - 120; y += 120) {
    for (const right of [false, true]) {
      if (rng() < 0.3) continue;
      const x = right ? width - 30 + rng() * 22 : 10 + rng() * 22;
      const ty = y + rng() * 60;
      const blocked = features.some(f => isRightSide(f.x, width) === right && isNear(f.y, ty, 90));
      if (blocked) continue;
      trees.push({ x, y: ty, s: 0.8 + rng() * 0.35, pine: rng() < 0.4 });
    }
  }
  return { bushes, trees, features, tufts };
}

const isRightSide = (x: number, width: number) => x * 2 >= width;
function isNear(a: number, b: number, gap: number) {
  return gap >= Math.abs(a - b);
}

function routePath(segment: Segment, width: number): string {
  // Include the neighbours above and below so the road joins the next segment
  const ids: number[] = [];
  for (let id = Math.max(1, segment.firstLevel - 1); id <= segment.lastLevel + 1; id++) ids.push(id);
  const pts = ids.map(id => [levelX(id, width), levelYInSegment(id, segment.index)]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const my = (y0 + y1) / 2;
    d += ` C ${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
  }
  return d;
}

// Wavy lower edge of the next world's land, drawn over the top of this one
function edgePath(width: number) {
  const step = width / 6;
  let d = `M0 0H${width}V16`;
  const ys = [34, 20, 22, 16, 26, 18, 24];
  for (let i = 6; i > 0; i--) {
    d += `Q${step * i - step / 2} ${ys[i]} ${step * (i - 1)} ${ys[i - 1] - 8}`;
  }
  return `${d}Z`;
}

function Tree({ tree, palette }: { tree: Tree; palette: WorldPalette }) {
  const { x, y, s } = tree;
  if (tree.pine) {
    const d = `M${x} ${y - 60 * s}L${x + 19 * s} ${y - 10 * s}H${x - 19 * s}Z`;
    return (
      <Group>
        <Path path={d} color={INK_SHADOW} transform={[{ translateX: 2 }, { translateY: 4 }]} />
        <Rect x={x - 3 * s} y={y - 10 * s} width={6 * s} height={10 * s} color="#6B4A32" />
        <Path path={d} color={palette.near} />
      </Group>
    );
  }
  return (
    <Group>
      <Circle cx={x + 2} cy={y - 27 * s + 4} r={17 * s} color={INK_SHADOW} />
      <Rect x={x - 3 * s} y={y - 14 * s} width={6 * s} height={14 * s} color="#7A5A3A" />
      <Circle cx={x} cy={y - 27 * s} r={17 * s} color={palette.near} />
      <Circle cx={x - 6 * s} cy={y - 32 * s} r={6 * s} color="rgba(255,255,255,0.2)" />
    </Group>
  );
}

function Pond({ x, y }: { x: number; y: number }) {
  return (
    <Group>
      <Oval x={x - 62} y={y - 23} width={124} height={60} color={INK_SHADOW} />
      <Oval x={x - 62} y={y - 30} width={124} height={60} color="#EADFC6" />
      <Oval x={x - 54} y={y - 24} width={108} height={48} color="#7FC4D8" />
      <Oval x={x - 38} y={y - 12} width={44} height={10} color="rgba(255,255,255,0.35)" />
      <Path
        path={`M${x + 44} ${y}v-18M${x + 48} ${y + 2}v-14M${x + 52} ${y}v-20M${x - 50} ${y + 2}v-16M${x - 46} ${y}v-12`}
        color="#4E8A4E"
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
    </Group>
  );
}

function Cottage({ x, y, palette }: { x: number; y: number; palette: WorldPalette }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Oval x={-34} y={-4} width={68} height={16} color={INK_SHADOW} />
      <Rect x={-24} y={-30} width={48} height={32} color={colors.bgCream} />
      <Rect x={8} y={-30} width={16} height={32} color="rgba(0,0,0,0.08)" />
      <Path path="M-30 -28L0 -54L30 -28Z" color={palette.accent} />
      <Path path="M0 -54L30 -28H0Z" color="rgba(0,0,0,0.1)" />
      <Rect x={-6} y={-14} width={12} height={16} color="#6B3A2C" />
      <Rect x={-19} y={-24} width={9} height={9} color="#8FB7C9" />
    </Group>
  );
}

function Feature({ feature, palette }: { feature: Feature; palette: WorldPalette }) {
  if (feature.pond) return <Pond x={feature.x} y={feature.y} />;
  return <Cottage x={feature.x} y={feature.y + 20} palette={palette} />;
}

export const WorldChunk = memo(function WorldChunkView({
  segment,
  width,
  currentLevel,
  stars,
  reduceMotion,
  onPressLevel,
}: Props) {
  const t = useT();
  const boughtWorlds = useProgress(s => s.boughtWorlds);
  const bought = boughtWorlds.includes(segment.world);
  const world = WORLDS[segment.world - 1];
  const { palette } = world;
  const nextWorld = segment.part === SEGMENTS_PER_WORLD - 1 ? WORLDS[segment.world] : undefined;
  const scenery = useMemo(() => buildScenery(segment, width), [segment, width]);
  const road = useMemo(() => routePath(segment, width), [segment, width]);
  const edge = useMemo(() => edgePath(width), [width]);

  const levels = useMemo(() => {
    const out = [];
    for (let id = segment.firstLevel; id <= segment.lastLevel; id++) {
      out.push({ id, x: levelX(id, width), y: levelYInSegment(id, segment.index) });
    }
    return out;
  }, [segment, width]);

  const landmarks = useMemo(
    () =>
      levels.flatMap(l => {
        const info = landmarkAt(l.id);
        if (!info) return [];
        // The sight stands on the far side of the road from its node
        const onLeft = l.x > width / 2;
        return [{ ...l, info, artX: onLeft ? 6 : width - LANDMARK_SIZE - 6, artY: l.y - LANDMARK_SIZE + 40 }];
      }),
    [levels, width],
  );
  const current = levels.find(l => l.id === currentLevel);
  const landmarkName = (id: number) => {
    const info = landmarks.find(l => l.id === id)?.info;
    return info ? t(landmarkKey(info.key)) : undefined;
  };

  // Where the sketch starts: just above the current node, the whole stretch above it, or nowhere below it
  const sketchTo = current
    ? Math.max(0, current.y - CURRENT_R - 30)
    : segment.firstLevel > currentLevel && !bought
      ? SEGMENT_HEIGHT
      : 0;

  const scene: ReactNode = (
    <Group>
      <Rect x={0} y={0} width={width} height={SEGMENT_HEIGHT} color={palette.far} />
      {scenery.bushes.map((b, i) => (
        <Circle key={`bs${i}`} cx={b.cx} cy={b.cy + 6} r={b.r} color={INK_SHADOW} />
      ))}
      {scenery.bushes.map((b, i) => (
        <Circle key={`b${i}`} cx={b.cx} cy={b.cy} r={b.r} color={palette.mid} />
      ))}
      <Path path={scenery.tufts} color={TUFT} style="stroke" strokeWidth={2} strokeCap="round" />

      {/* raised paper road with a dashed centre line */}
      <Group transform={[{ translateY: 5 }]}>
        <Path path={road} color={INK_SHADOW} style="stroke" strokeWidth={30} strokeCap="round" />
      </Group>
      <Path path={road} color={ROAD} style="stroke" strokeWidth={30} strokeCap="round" />
      <Path path={road} color={ROAD_LINE} style="stroke" strokeWidth={4} strokeCap="round">
        <DashPathEffect intervals={[10, 14]} />
      </Path>

      {scenery.features.map((f, i) => (
        <Feature key={`f${i}`} feature={f} palette={palette} />
      ))}
      {scenery.trees.map((tree, i) => (
        <Tree key={`t${i}`} tree={tree} palette={palette} />
      ))}

      {landmarks.map(({ id, info, artX: x, artY: y }) => {
        const scale = LANDMARK_SIZE / 100;
        return (
          <Group key={`l${id}`}>
            <Group transform={[{ translateX: x + 7 }, { translateY: y + 9 }, { scale }]}>
              <Path path={info.path} color={INK_SHADOW} />
            </Group>
            {/* stacked layers give the silhouette a solid, extruded depth */}
            {EXTRUDE_STEPS.map(step => (
              <Group key={step} transform={[{ translateX: x + step }, { translateY: y + step }, { scale }]}>
                <Path path={info.path} color={palette.near} />
              </Group>
            ))}
            <Group transform={[{ translateX: x }, { translateY: y }, { scale }]}>
              <Path path={info.path} color={palette.accent} />
            </Group>
          </Group>
        );
      })}

      {nextWorld && (
        <Group>
          <Path path={edge} color={INK_SHADOW} transform={[{ translateY: 5 }]} />
          <Path path={edge} color={nextWorld.palette.far} />
        </Group>
      )}
    </Group>
  );

  return (
    <View style={{ width, height: SEGMENT_HEIGHT }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {sketchTo <= 0 ? (
          scene
        ) : (
          <>
            <Group clip={{ x: 0, y: 0, width, height: sketchTo }} layer={<Paint><ColorMatrix matrix={GREY} /></Paint>}>
              {scene}
            </Group>
            {sketchTo < SEGMENT_HEIGHT && (
              <Group clip={{ x: 0, y: sketchTo, width, height: SEGMENT_HEIGHT - sketchTo }}>{scene}</Group>
            )}
          </>
        )}
      </Canvas>

      {segment.part === 0 && <WorldPostcard worldId={world.id} currentLevel={currentLevel} />}

      {/* paper name plaque at the foot of each sight; one line so it never covers the next node */}
      {landmarks.map(({ id, info, artX, artY }) => (
        <View
          key={`tag${id}`}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={[styles.tag, { left: artX - 4, top: artY + LANDMARK_SIZE - 2, width: LANDMARK_SIZE + 8 }]}
        >
          <Text
            style={[styles.tagText, { borderColor: palette.accent }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {t(landmarkKey(info.key))}
          </Text>
        </View>
      ))}

      {levels.map(l => {
        const state: NodeState =
          l.id < currentLevel || stars[l.id]
            ? 'done'
            : isLevelOpen(l.id, currentLevel, stars, boughtWorlds)
              ? 'current'
              : 'locked';
        return (
          <LevelNode
            key={l.id}
            levelId={l.id}
            state={state}
            stars={stars[l.id] ?? 0}
            landmark={isLandmark(l.id)}
            worldEnd={l.id % LEVELS_PER_WORLD === 0}
            landmarkName={landmarkName(l.id)}
            x={l.x}
            y={l.y}
            reduceMotion={reduceMotion}
            onPress={onPressLevel}
          />
        );
      })}

      {current && <Balloon x={current.x} y={current.y} nodeRadius={CURRENT_R} reduceMotion={reduceMotion} />}
    </View>
  );
});

// Taped postcard at the start of each world; the colour fills in as its levels are won
function WorldPostcard({ worldId, currentLevel }: { worldId: number; currentLevel: number }) {
  const t = useT();
  const art = POSTCARD_ASSETS[worldId as WorldId];
  const done = Math.max(0, Math.min(LEVELS_PER_WORLD, currentLevel - 1 - (worldId - 1) * LEVELS_PER_WORLD));
  const name = t(worldKey(worldId));
  return (
    <View
      style={[styles.card, { top: SEGMENT_HEIGHT - SEGMENT_GAP + 8 }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${t('common.world', { n: worldId })}, ${name}`}
    >
      <View style={styles.photo}>
        {art && <Image source={art.gray} style={styles.photoFill} />}
        {art && done > 0 && (
          <Image source={art.color} style={[styles.photoFill, { opacity: done / LEVELS_PER_WORLD }]} />
        )}
      </View>
      <View style={styles.tape} />
      <View style={styles.stamp}>
        <Text style={styles.stampText}>{worldId}</Text>
      </View>
      <View style={styles.nameTag}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: CARD_W,
    transform: [{ rotate: '-2deg' }],
  },
  photo: {
    width: '100%',
    aspectRatio: 1080 / 489,
    borderWidth: 6,
    borderColor: '#FFFDF7',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E4DDCF',
    elevation: 6,
    shadowColor: '#3C2814',
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
  },
  photoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  tape: {
    position: 'absolute',
    top: -10,
    left: CARD_W / 2 - 37,
    width: 74,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ rotate: '4deg' }],
    elevation: 7,
  },
  stamp: {
    position: 'absolute',
    top: -16,
    right: -12,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primaryOcean,
    backgroundColor: colors.bgCream,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    elevation: 7,
  },
  stampText: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  nameTag: {
    position: 'absolute',
    bottom: -16,
    alignSelf: 'center',
    maxWidth: CARD_W,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.ink,
    transform: [{ rotate: '3deg' }],
    elevation: 7,
  },
  nameText: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.bgCream,
  },
  tag: {
    position: 'absolute',
    alignItems: 'center',
  },
  tagText: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: colors.bgCream,
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
