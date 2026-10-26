import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { WORLD_COUNT, WorldDef, WORLDS } from '../game/levels/worlds';
import { borderViewFor, deviceLocale } from '../map/borderView';
import { Globe3D } from '../map/Globe3D';
import { WorldCard } from '../map/WorldCard';
import { unlockedWorldOf, worldStats, worldStatuses } from '../map/worldProgress';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { Screen } from '../ui/Screen';
import { Toast } from '../ui/Toast';
import { colors, fonts } from '../ui/theme';
import { useT, worldKey } from '../i18n';

const CARD_GAP = 12;
const WIDE_PANEL = 340;
const UNLOCK_DELAY_MS = 700;
const UNLOCK_SHOWN_MS = 1800;

export function GlobeScreen({ navigation }: ScreenProps<'Globe'>) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const currentLevel = useProgress(s => s.currentLevel);
  const stars = useProgress(s => s.stars);
  const lastSeenWorld = useProgress(s => s.lastSeenWorld);
  const markWorldSeen = useProgress(s => s.markWorldSeen);
  const reduceMotion = useSettings(s => s.reduceMotion);
  const lang = useSettings(s => s.lang);
  const borderView = useMemo(() => borderViewFor(lang, deviceLocale()), [lang]);

  const statuses = useMemo(() => worldStatuses(currentLevel, stars), [currentLevel, stars]);
  const unlockedWorld = unlockedWorldOf(currentLevel);
  const newlyUnlocked = unlockedWorld > lastSeenWorld;
  // With an unlock to show, start at the last stop and fly to the new one
  const startWorld = newlyUnlocked && !reduceMotion ? Math.max(1, lastSeenWorld) : unlockedWorld;

  const [selected, setSelected] = useState(startWorld);
  const [focus, setFocus] = useState({ world: startWorld, seq: 0 });
  const [unveil, setUnveil] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const [globeBox, setGlobeBox] = useState({ w: 0, h: 0 });
  const listRef = useRef<FlatList<WorldDef>>(null);

  const wide = width >= 700 || width > height * 1.2;
  const cardWidth = wide ? WIDE_PANEL - 32 : Math.min(320, Math.round(width * 0.78));
  const snap = cardWidth + CARD_GAP;

  const select = useCallback(
    (world: number, scrollList = true) => {
      setSelected(world);
      setFocus(f => ({ world, seq: f.seq + 1 }));
      if (scrollList) listRef.current?.scrollToIndex({ index: world - 1, animated: !reduceMotion, viewPosition: 0.5 });
    },
    [reduceMotion],
  );

  // New world unlocked: blow its cloud away and fly there once
  useEffect(() => {
    if (!newlyUnlocked) return;
    if (reduceMotion) {
      markWorldSeen(unlockedWorld);
      return;
    }
    const fly = setTimeout(() => {
      setUnveil(unlockedWorld);
      select(unlockedWorld);
      setToast({ text: t('globe.unlocked', { world: t(worldKey(unlockedWorld)) }) });
    }, UNLOCK_DELAY_MS);
    const done = setTimeout(() => markWorldSeen(unlockedWorld), UNLOCK_DELAY_MS + UNLOCK_SHOWN_MS);
    return () => {
      clearTimeout(fly);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the screen opens
  }, []);

  const onCarouselEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / snap);
    const world = Math.min(WORLD_COUNT, Math.max(1, index + 1));
    if (world !== selected) select(world, false);
  };

  const openWorld = (world: number) => navigation.popTo('Map', { focusWorld: world });

  const onGlobeLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setGlobeBox({ w, h });
  };

  const worldsDone = statuses.filter(s => s === 'done').length;
  const totalStars = Object.values(stars).reduce((sum, s) => sum + s, 0);

  const renderCard = ({ item }: { item: WorldDef }) => (
    <WorldCard
      world={item}
      status={statuses[item.id - 1]}
      stats={worldStats(item.id, stars)}
      selected={item.id === selected}
      width={cardWidth}
      lockedHint={item.id > 1 ? t('globe.lockedHint', { world: t(worldKey(item.id - 1)) }) : ''}
      onPress={() => select(item.id)}
      onOpen={() => openWorld(item.id)}
    />
  );

  const globe = (
    <View style={styles.globeArea} onLayout={onGlobeLayout}>
      {globeBox.w > 0 && (
        <Globe3D
          width={globeBox.w}
          height={globeBox.h}
          statuses={statuses}
          selectedWorld={selected}
          focus={focus}
          unveilWorld={unveil}
          borderView={borderView}
          reduceMotion={reduceMotion}
          onSelectWorld={select}
        />
      )}
    </View>
  );

  return (
    <Screen title={t('globe.title')} onBack={() => navigation.goBack()}>
      <View style={styles.body}>
        <Text style={styles.summary} accessibilityRole="summary">
          🌍 {unlockedWorld}/{WORLD_COUNT} stops  ·  🎫 {worldsDone} stamps  ·  ★ {totalStars}
        </Text>

        {wide ? (
          <View style={styles.row}>
            {globe}
            <FlatList
              ref={listRef}
              style={{ width: WIDE_PANEL }}
              contentContainerStyle={styles.sideList}
              data={WORLDS}
              keyExtractor={w => String(w.id)}
              renderItem={renderCard}
              ItemSeparatorComponent={Separator}
              initialScrollIndex={startWorld - 1}
              onScrollToIndexFailed={() => {}}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <>
            {globe}
            <FlatList
              ref={listRef}
              horizontal
              data={WORLDS}
              keyExtractor={w => String(w.id)}
              renderItem={renderCard}
              ItemSeparatorComponent={GapH}
              contentContainerStyle={{ paddingHorizontal: (width - cardWidth) / 2 - 16 }}
              getItemLayout={(_, index) => ({ length: snap, offset: snap * index, index })}
              initialScrollIndex={startWorld - 1}
              snapToInterval={snap}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselEnd}
              style={styles.carousel}
            />
          </>
        )}
      </View>
      <Toast toast={toast} />
    </Screen>
  );
}

const Separator = () => <View style={styles.vGap} />;
const GapH = () => <View style={styles.hGap} />;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignSelf: 'stretch',
  },
  summary: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  globeArea: {
    flex: 1,
    minHeight: 220,
  },
  carousel: {
    flexGrow: 0,
    marginBottom: 12,
  },
  sideList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  vGap: {
    height: CARD_GAP,
  },
  hGap: {
    width: CARD_GAP,
  },
});
