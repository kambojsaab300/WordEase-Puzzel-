import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import type { WorldDef } from '../game/levels/worlds';
import { LANDMARK_PATHS } from '../map/landmarks';
import { landmarkKey, worldLandmarks } from '../map/landmarkPlan';
import { LandmarkArt } from './LandmarkArt';
import { colors, fonts } from './theme';
import { useT, worldKey } from '../i18n';

type Props = {
  world: WorldDef;
  collected: boolean;
  size?: number;
  /** Which of the world's 4 landmarks the player has reached; shows a row of small sights when given */
  visited?: boolean[];
};

const UNVISITED = '#CFC8BA';

export function PassportStamp({ world, collected, size = 150, visited }: Props) {
  const t = useT();
  const name = t(worldKey(world.id));
  const art = size * 0.48;
  const landmarks = visited ? worldLandmarks(world.id) : [];
  const mini = Math.min(34, Math.floor((size - 28) / Math.max(1, landmarks.length)));
  return (
    <View
      style={[
        styles.stamp,
        { width: size, minHeight: size * 1.1 },
        collected
          ? { backgroundColor: world.palette.sky, borderColor: world.palette.accent }
          : styles.empty,
      ]}
      accessibilityLabel={t(collected ? 'stamp.collected' : 'stamp.missing', { world: name })}
    >
      {collected ? (
        <Canvas style={{ width: art, height: art }}>
          <Group transform={[{ scale: art / 100 }]}>
            <Path path={LANDMARK_PATHS[world.landmark]} color={world.palette.accent} />
          </Group>
        </Canvas>
      ) : (
        <Text style={[styles.question, { height: art, fontSize: art * 0.7 }]}>?</Text>
      )}
      <Text style={styles.world}>{t('common.world', { n: world.id })}</Text>
      <Text style={[styles.name, !collected && styles.muted]} numberOfLines={2}>
        {name}
      </Text>
      {landmarks.length > 0 && (
        <View
          style={styles.landmarks}
          accessible
          accessibilityLabel={landmarks
            .map((l, i) => t(visited?.[i] ? 'landmark.visited' : 'landmark.missing', { name: t(landmarkKey(l.key)) }))
            .join(', ')}
        >
          {landmarks.map((l, i) => (
            <LandmarkArt
              key={l.key}
              path={l.path}
              color={visited?.[i] ? world.palette.accent : UNVISITED}
              size={mini}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    margin: 6,
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  empty: {
    backgroundColor: '#F8F2E6',
    borderColor: '#CFC8BA',
  },
  question: {
    fontFamily: fonts.uiBold,
    color: '#CFC8BA',
    textAlign: 'center',
  },
  world: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  name: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  landmarks: {
    flexDirection: 'row',
    marginTop: 6,
  },
  muted: {
    color: '#7A7365',
  },
});
