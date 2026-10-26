import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import type { WorldDef } from '../game/levels/worlds';
import { colors, fonts } from '../ui/theme';
import type { WorldStats, WorldStatus } from './worldProgress';
import { LANDMARK_PATHS } from './landmarks';
import { TKey, useT, worldKey } from '../i18n';

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

const STATUS_TEXT: Record<WorldStatus, TKey> = {
  done: 'card.done',
  current: 'card.current',
  open: 'card.open',
  locked: 'card.locked',
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
  const t = useT();
  const name = t(worldKey(world.id));
  const statusText = t(STATUS_TEXT[status]);
  const locked = status === 'locked';
  const art = 64;
  const progress = stats.total ? stats.levelsDone / stats.total : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={t('card.a11y', {
        n: world.id,
        world: name,
        status: statusText,
        done: stats.levelsDone,
        total: stats.total,
        stars: stats.stars,
      })}
      style={[
        styles.card,
        locked ? styles.cardLocked : { backgroundColor: world.palette.sky },
        { width },
        selected && (locked ? styles.selectedLocked : { borderColor: world.palette.accent }),
      ]}
    >
      <View style={styles.top}>
        <View style={styles.titleCol}>
          <Text style={styles.worldNo}>{t('common.world', { n: world.id })}</Text>
          <Text style={[styles.name, locked && styles.muted]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.status, status === 'current' && styles.statusCurrent]}>{statusText}</Text>
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
          {t('card.levels', { done: stats.levelsDone, total: stats.total })}
        </Text>
        <Text style={styles.stat}>★ {stats.stars}</Text>
      </View>

      {locked ? (
        <Text style={styles.lockedHint}>{lockedHint}</Text>
      ) : (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={t('card.openMapA11y', { world: name })}
          style={({ pressed }) => [styles.open, pressed && styles.pressed]}
        >
          <Text style={styles.openText}>{t('card.openMap')}</Text>
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
  cardLocked: {
    backgroundColor: '#EFE8DA',
  },
  selectedLocked: {
    borderColor: '#B9B2A4',
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
