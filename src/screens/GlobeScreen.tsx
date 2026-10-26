import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { WORLD_COUNT, WorldDef, WORLDS } from '../game/levels/worlds';
import { worldLandmarks } from '../map/landmarkPlan';
import { WorldCard } from '../map/WorldCard';
import { unlockedWorldOf, worldStats, worldStatuses } from '../map/worldProgress';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { Screen } from '../ui/Screen';
import { Toast } from '../ui/Toast';
import { colors, fonts } from '../ui/theme';
import { useT, worldKey } from '../i18n';

const CARD_GAP = 14;
const TWO_COLUMNS_FROM = 700;

// World Trip: a plain list of the 20 stops, one big card each, opened at the player's current stop
export function GlobeScreen({ navigation }: ScreenProps<'Globe'>) {
  const t = useT();
  const { width } = useWindowDimensions();
  const currentLevel = useProgress(s => s.currentLevel);
  const stars = useProgress(s => s.stars);
  const lastSeenWorld = useProgress(s => s.lastSeenWorld);
  const markWorldSeen = useProgress(s => s.markWorldSeen);
  const reduceMotion = useSettings(s => s.reduceMotion);

  const statuses = useMemo(() => worldStatuses(currentLevel, stars), [currentLevel, stars]);
  const unlockedWorld = unlockedWorldOf(currentLevel);
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const listRef = useRef<FlatList<WorldDef>>(null);
  const columns = width >= TWO_COLUMNS_FROM ? 2 : 1;

  // A newly unlocked world is announced once
  useEffect(() => {
    if (unlockedWorld <= lastSeenWorld) return;
    setToast({ text: t('globe.unlocked', { world: t(worldKey(unlockedWorld)) }) });
    markWorldSeen(unlockedWorld);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the screen opens
  }, []);

  // Open at the current stop; rows have different heights, so scroll after the first layout
  useEffect(() => {
    const row = Math.floor((unlockedWorld - 1) / columns);
    if (row === 0) return;
    const timer = setTimeout(
      () => listRef.current?.scrollToIndex({ index: row, animated: !reduceMotion, viewPosition: 0.3 }),
      150,
    );
    return () => clearTimeout(timer);
  }, [unlockedWorld, columns, reduceMotion]);

  const worldsDone = statuses.filter(s => s === 'done').length;
  const totalStars = Object.values(stars).reduce((sum, s) => sum + s, 0);

  const renderCard = ({ item }: { item: WorldDef }) => (
    <View style={columns === 2 ? styles.half : styles.full}>
      <WorldCard
        world={item}
        status={statuses[item.id - 1]}
        stats={worldStats(item.id, stars)}
        visited={worldLandmarks(item.id).map(l => Boolean(stars[l.levelId]))}
        lockedHint={item.id > 1 ? t('globe.lockedHint', { world: t(worldKey(item.id - 1)) }) : ''}
        onOpen={() => navigation.popTo('Map', { focusWorld: item.id })}
      />
    </View>
  );

  return (
    <Screen title={t('globe.title')} onBack={() => navigation.goBack()}>
      <View style={styles.body}>
        <Text style={styles.summary} accessibilityRole="summary">
          {t('globe.summary', { n: unlockedWorld, total: WORLD_COUNT, stamps: worldsDone, stars: totalStars })}
        </Text>
        <FlatList
          ref={listRef}
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns === 2 ? styles.columns : undefined}
          data={WORLDS}
          keyExtractor={w => String(w.id)}
          renderItem={renderCard}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          onScrollToIndexFailed={info =>
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Toast toast={toast} />
    </Screen>
  );
}

const Separator = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignSelf: 'stretch',
  },
  summary: {
    marginBottom: 10,
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  full: {
    flex: 1,
  },
  half: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: CARD_GAP / 2,
  },
  columns: {
    marginHorizontal: -CARD_GAP / 2,
  },
  gap: {
    height: CARD_GAP,
  },
});
