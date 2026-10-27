import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { POSTCARD_ASSETS, type WorldId } from '../assets/postcards';
import type { WorldDef } from '../game/levels/worlds';
import { LandmarkArt } from '../ui/LandmarkArt';
import { colors, fonts } from '../ui/theme';
import { landmarkKey, worldLandmarks } from './landmarkPlan';
import { LANDMARK_PATHS } from './landmarks';
import type { WorldStats, WorldStatus } from './worldProgress';
import { TKey, useT, worldKey } from '../i18n';
import { withTap } from '../ui/withTap';

type Props = {
  world: WorldDef;
  status: WorldStatus;
  stats: WorldStats;
  /** Which of the world's 4 landmarks are reached */
  visited: boolean[];
  lockedHint: string;
  /** Coins to open this locked world early; no button when undefined */
  unlockCost?: number;
  onUnlock?: () => void;
  onOpen: () => void;
};

const STATUS_TEXT: Record<WorldStatus, TKey> = {
  done: 'card.done',
  current: 'card.current',
  open: 'card.open',
  locked: 'card.locked',
};

const LOCKED = '#CFC8BA';

// One stop of the World Trip as a big, plain card: the whole card opens the world on the route
export const WorldCard = memo(function WorldCardView({
  world,
  status,
  stats,
  visited,
  lockedHint,
  unlockCost,
  onUnlock,
  onOpen,
}: Props) {
  const t = useT();
  const name = t(worldKey(world.id));
  const statusText = t(STATUS_TEXT[status]);
  const locked = status === 'locked';
  const current = status === 'current';
  const progress = stats.total ? stats.levelsDone / stats.total : 0;
  const landmarks = worldLandmarks(world.id);
  const postcard = POSTCARD_ASSETS[world.id as WorldId];

  return (
    <Pressable
      onPress={locked ? undefined : withTap(onOpen)}
      disabled={locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${t('card.a11y', {
        n: world.id,
        world: name,
        status: statusText,
        done: stats.levelsDone,
        total: stats.total,
        stars: stats.stars,
      })} ${locked ? lockedHint : t('card.openMapA11y', { world: name })}`}
      style={({ pressed }) => [
        styles.card,
        locked ? styles.cardLocked : { backgroundColor: world.palette.sky },
        current && styles.cardCurrent,
        pressed && styles.pressed,
      ]}
    >
      {/* Paint the Postcard: the grey sketch fills with colour as levels are won */}
      {postcard && (
        <View style={styles.postcard} importantForAccessibility="no-hide-descendants">
          <Image source={postcard.gray} style={styles.postcardFill} />
          {!locked && <Image source={postcard.color} style={[styles.postcardFill, { opacity: progress }]} />}
        </View>
      )}
      <View style={styles.top}>
        <View style={[styles.artTile, locked && styles.artTileLocked]}>
          <LandmarkArt path={LANDMARK_PATHS[world.landmark]} color={locked ? LOCKED : world.palette.accent} size={64} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.worldNo}>{t('common.world', { n: world.id })}</Text>
          <Text style={[styles.name, locked && styles.muted]} numberOfLines={2}>
            {name}
          </Text>
          <Text style={[styles.status, current && styles.statusCurrent, locked && styles.muted]}>{statusText}</Text>
        </View>
      </View>

      {!locked && (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: world.palette.accent }]} />
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{t('card.levels', { done: stats.levelsDone, total: stats.total })}</Text>
            <Text style={styles.stat}>★ {stats.stars}</Text>
          </View>
          <View style={styles.landmarks} importantForAccessibility="no-hide-descendants">
            {landmarks.map((l, i) => (
              <View key={l.key} style={styles.landmark}>
                <LandmarkArt path={l.path} color={visited[i] ? world.palette.accent : LOCKED} size={30} />
                <Text style={[styles.landmarkName, !visited[i] && styles.muted]} numberOfLines={2}>
                  {t(landmarkKey(l.key))}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {locked ? (
        <>
          <Text style={styles.lockedHint}>{lockedHint}</Text>
          {unlockCost !== undefined && onUnlock && (
            <Pressable
              onPress={withTap(onUnlock)}
              accessibilityRole="button"
              accessibilityLabel={t('card.unlockA11y', { world: name, cost: unlockCost })}
              style={({ pressed }) => [styles.open, styles.unlock, pressed && styles.pressed]}
            >
              <Text style={styles.openText}>{t('card.unlock', { cost: unlockCost })}</Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={[styles.open, current && styles.openCurrent]}>
          <Text style={styles.openText}>{t(current ? 'card.continue' : 'card.openMap')}</Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cardLocked: {
    backgroundColor: '#EFE8DA',
  },
  cardCurrent: {
    borderColor: colors.accentCoral,
  },
  pressed: {
    opacity: 0.85,
  },
  postcard: {
    width: '100%',
    aspectRatio: 1080 / 489,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E4DDCF',
  },
  postcardFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artTile: {
    width: 80,
    height: 80,
    marginRight: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  artTileLocked: {
    backgroundColor: '#E4DDCF',
  },
  titleCol: {
    flex: 1,
  },
  worldNo: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  muted: {
    color: '#6E685C',
  },
  status: {
    marginTop: 2,
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  statusCurrent: {
    color: '#C04F36',
  },
  track: {
    height: 12,
    marginTop: 14,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(31,42,55,0.12)',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stat: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  landmarks: {
    flexDirection: 'row',
    marginTop: 12,
  },
  landmark: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  landmarkName: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
  open: {
    minHeight: 56,
    marginTop: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryOcean,
  },
  openCurrent: {
    backgroundColor: colors.accentCoral,
  },
  unlock: {
    backgroundColor: '#C9933B',
  },
  openText: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  lockedHint: {
    marginTop: 12,
    fontSize: 17,
    fontFamily: fonts.ui,
    color: '#6E685C',
  },
});
