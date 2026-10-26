import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  FractalNoise,
  Group,
  Oval,
  Path,
  Rect,
} from '@shopify/react-native-skia';
import { mulberry32 } from '../game/generator/prng';
import { isLandmark } from '../game/levels/levelSpec';
import { WORLDS } from '../game/levels/worlds';
import { colors, fonts } from '../ui/theme';
import { LANDMARK_PATHS } from './landmarks';
import { levelX, levelYInSegment, Segment, SEGMENT_GAP, SEGMENT_HEIGHT } from './layout';
import { LevelNode, NodeState } from './LevelNode';
import { PaperPlane } from './PaperPlane';
import { useT, worldKey } from '../i18n';

const SHADOW = 'rgba(31, 42, 55, 0.10)';
const LANDMARK_SIZE = 120;

type Props = {
  segment: Segment;
  width: number;
  currentLevel: number;
  stars: Record<number, number>;
  reduceMotion: boolean;
  onPressLevel: (levelId: number) => void;
};

type Hill = { cx: number; cy: number; rx: number; ry: number; color: string };
type Tree = { x: number; y: number; r: number };

// Paper-cutout scenery along both edges, the same every time for a given segment
function buildScenery(segmentIndex: number, width: number, palette: (typeof WORLDS)[number]['palette']) {
  const rng = mulberry32(segmentIndex * 7919 + 13);
  const hills: Hill[] = [];
  const trees: Tree[] = [];
  const layers = [palette.far, palette.mid, palette.near];

  for (let i = 0; i < 5; i++) {
    const left = i % 2 === 0;
    const cy = (i + 0.3 + rng() * 0.5) * (SEGMENT_HEIGHT / 5);
    layers.forEach((color, layer) => {
      const rx = width * (0.32 - layer * 0.06);
      hills.push({
        cx: left ? -width * 0.06 + layer * 6 : width * 1.06 - layer * 6,
        cy: cy + layer * 34,
        rx,
        ry: 110 - layer * 22,
        color,
      });
    });
    trees.push({
      x: left ? width * (0.05 + rng() * 0.08) : width * (0.87 + rng() * 0.08),
      y: cy - 60 - rng() * 40,
      r: 14 + rng() * 8,
    });
  }
  return { hills, trees };
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

export const WorldChunk = memo(function WorldChunkView({
  segment,
  width,
  currentLevel,
  stars,
  reduceMotion,
  onPressLevel,
}: Props) {
  const t = useT();
  const world = WORLDS[segment.world - 1];
  const { palette } = world;
  const scenery = useMemo(
    () => buildScenery(segment.index, width, palette),
    [segment.index, width, palette],
  );
  const road = useMemo(() => routePath(segment, width), [segment, width]);

  const levels = useMemo(() => {
    const out = [];
    for (let id = segment.firstLevel; id <= segment.lastLevel; id++) {
      out.push({ id, x: levelX(id, width), y: levelYInSegment(id, segment.index) });
    }
    return out;
  }, [segment, width]);

  const landmarks = levels.filter(l => isLandmark(l.id));
  const current = levels.find(l => l.id === currentLevel);

  return (
    <View style={{ width, height: SEGMENT_HEIGHT }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={SEGMENT_HEIGHT} color={palette.sky} />
        {/* faint paper grain */}
        <Rect x={0} y={0} width={width} height={SEGMENT_HEIGHT} opacity={0.05}>
          <FractalNoise freqX={0.7} freqY={0.7} octaves={2} />
        </Rect>

        {scenery.hills.map((h, i) => (
          <Group key={`h${i}`}>
            <Oval x={h.cx - h.rx} y={h.cy - h.ry + 5} width={h.rx * 2} height={h.ry * 2} color={SHADOW} />
            <Oval x={h.cx - h.rx} y={h.cy - h.ry} width={h.rx * 2} height={h.ry * 2} color={h.color} />
          </Group>
        ))}
        {scenery.trees.map((tree, i) => (
          <Group key={`t${i}`}>
            <Rect x={tree.x - 3} y={tree.y} width={6} height={tree.r * 1.6} color={palette.near} />
            <Circle cx={tree.x} cy={tree.y + 3} r={tree.r} color={SHADOW} />
            <Circle cx={tree.x} cy={tree.y} r={tree.r} color={palette.near} />
          </Group>
        ))}

        {landmarks.map(l => {
          const onLeft = l.x > width / 2;
          const x = onLeft ? 6 : width - LANDMARK_SIZE - 6;
          const y = l.y - LANDMARK_SIZE + 40;
          const scale = LANDMARK_SIZE / 100;
          return (
            <Group key={`l${l.id}`}>
              <Group transform={[{ translateX: x + 4 }, { translateY: y + 5 }, { scale }]}>
                <Path path={LANDMARK_PATHS[world.landmark]} color={SHADOW} />
              </Group>
              <Group transform={[{ translateX: x }, { translateY: y }, { scale }]}>
                <Path path={LANDMARK_PATHS[world.landmark]} color={palette.accent} opacity={0.85} />
              </Group>
            </Group>
          );
        })}

        <Path path={road} color="rgba(31, 42, 55, 0.35)" style="stroke" strokeWidth={8} strokeCap="round">
          <DashPathEffect intervals={[1, 18]} />
        </Path>
      </Canvas>

      {segment.part === 0 && (
        <View style={[styles.banner, { top: SEGMENT_HEIGHT - SEGMENT_GAP / 2 - 28 }]}>
          <Text style={styles.bannerSmall}>{t('common.world', { n: world.id })}</Text>
          <Text style={styles.bannerTitle}>{t(worldKey(world.id))}</Text>
        </View>
      )}

      {levels.map(l => {
        const state: NodeState =
          l.id < currentLevel || stars[l.id] ? 'done' : l.id === currentLevel ? 'current' : 'locked';
        return (
          <LevelNode
            key={l.id}
            levelId={l.id}
            state={state}
            stars={stars[l.id] ?? 0}
            landmark={isLandmark(l.id)}
            x={l.x}
            y={l.y}
            reduceMotion={reduceMotion}
            onPress={onPressLevel}
          />
        );
      })}

      {current && <PaperPlane x={current.x} y={current.y} reduceMotion={reduceMotion} />}
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.bgCream,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryOcean,
    alignItems: 'center',
  },
  bannerSmall: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
});
