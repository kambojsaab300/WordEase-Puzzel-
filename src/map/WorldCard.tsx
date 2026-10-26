import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import type { WorldDef } from '../game/levels/worlds';
import { colors, fonts } from '../ui/theme';
import type { WorldStatus } from './Globe3D';
import { LANDMARK_PATHS } from './landmarks';

export type WorldStats = { levelsDone: number; stars: number; total: number };

type Props = {
  world: WorldDef;
  status: WorldStatus;
  stats: WorldStats;
  selected: boolean;
  width: number;
  lockedHint: string;
  onPress: () => void;
  onOpen: () => void;
};

const STATUS_TEXT: Record<WorldStatus, string> = {
  done: 'Completed ✓',
  current: 'You are here ✈',
  open: 'Open',
  locked: 'Locked 🔒',
};

export const WorldCard = memo(function WorldCardView({
  world,
  status,
  stats,
  selected,
  width,
  lockedHint,
  onPress,
  onOpen,
}: Props) {
  const locked = status === 'locked';
  const art = 64;
  const progress = stats.total ? stats.levelsDone / stats.total : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`World ${world.id}, ${world.name}. ${STATUS_TEXT[status]}. ${stats.levelsDone} of ${stats.total} levels, ${stats.stars} stars.`}
      style={[
        styles.card,
        { width, backgroundColor: locked ? '#EFE8DA' : world.palette.sky },
        selected && { borderColor: locked ? '#B9B2A4' : world.palette.accent },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.titleCol}>
          <Text style={styles.worldNo}>World {world.id}</Text>
          <Text style={[styles.name, locked && styles.muted]} numberOfLines={1}>
            {world.name}
          </Text>
          <Text style={[styles.status, status === 'current' && styles.statusCurrent]}>{STATUS_TEXT[status]}</Text>
        </View>
        <Canvas style={{ width: art, height: art }}>
          <Group transform={[{ scale: art / 100 }]}>
            <Path path={LANDMARK_PATHS[world.landmark]} color={locked ? '#CFC8BA' : world.palette.accent} />
          </Group>
        </Canvas>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: world.palette.accent }]} />
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          {stats.levelsDone} / {stats.total} levels
        </Text>
        <Text style={styles.stat}>★ {stats.stars}</Text>
      </View>

      {locked ? (
        <Text style={styles.lockedHint}>{lockedHint}</Text>
      ) : (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Open ${world.name} on the map`}
          style={({ pressed }) => [styles.open, pressed && styles.pressed]}
        >
          <Text style={styles.openText}>Open on map</Text>
        </Pressable>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    elevation: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
    paddingRight: 8,
  },
  worldNo: {
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  name: {
    fontSize: 21,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  muted: {
    color: '#7A7365',
  },
  status: {
    marginTop: 2,
    fontSize: 15,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  statusCurrent: {
    color: colors.accentCoral,
  },
  track: {
    height: 8,
    marginTop: 10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(31,42,55,0.12)',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stat: {
    fontSize: 15,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  open: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryOcean,
  },
  pressed: {
    opacity: 0.8,
  },
  openText: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  lockedHint: {
    minHeight: 48,
    marginTop: 10,
    fontSize: 15,
    fontFamily: fonts.ui,
    color: '#6E685C',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
