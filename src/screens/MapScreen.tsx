import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScreenProps } from '../app/navigation';
import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { DAILY_LEVEL_ID, SHIPPED_LEVELS } from '../game/levels/levelRepo';
import { MAP_HEIGHT, scrollOffsetFor, SEGMENT_HEIGHT, SEGMENTS_PER_WORLD } from '../map/layout';
import { MapClouds } from '../map/MapClouds';
import { RouteMap } from '../map/RouteMap';
import { isLevelOpen, worldStats } from '../map/worldProgress';
import { WORLD_COUNT } from '../game/levels/worlds';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { CoinPill } from '../ui/CoinPill';
import { DailyCalendarModal } from '../ui/DailyCalendarModal';
import { IconButton } from '../ui/IconButton';
import { PrimaryButton } from '../ui/PrimaryButton';
import { QuizButton } from '../ui/QuizButton';
import { ShopModal } from '../ui/ShopModal';
import { Toast } from '../ui/Toast';
import { colors, fonts, fontSizes, sizes } from '../ui/theme';
import { useT, worldKey } from '../i18n';
import { AudioManager } from '../services/audio/AudioManager';

export function MapScreen({ navigation, route }: ScreenProps<'Map'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const coins = useWallet(s => s.coins);
  const currentLevel = useProgress(s => s.currentLevel);
  const stars = useProgress(s => s.stars);
  const reduceMotion = useSettings(s => s.reduceMotion);

  const mapLevel = Math.min(currentLevel, SHIPPED_LEVELS);
  const [focus, setFocus] = useState({ level: mapLevel, seq: 0 });
  const [dailyOpen, setDailyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const scrollY = useSharedValue(0);
  const { height } = useWindowDimensions();

  // The world chip follows the stretch of map in the middle of the screen
  const [viewWorld, setViewWorld] = useState(1);
  const [awayFromCurrent, setAwayFromCurrent] = useState(false);
  const currentOffset = scrollOffsetFor(mapLevel, height);
  useAnimatedReaction(
    () => {
      const fromBottom = MAP_HEIGHT - (scrollY.value + height / 2);
      const w = Math.floor(Math.max(0, fromBottom) / SEGMENT_HEIGHT / SEGMENTS_PER_WORLD) + 1;
      return { w: Math.min(WORLD_COUNT, w), away: Math.abs(scrollY.value - currentOffset) > height * 0.45 };
    },
    (now, before) => {
      if (now.w !== before?.w) runOnJS(setViewWorld)(now.w);
      if (now.away !== before?.away) runOnJS(setAwayFromCurrent)(now.away);
    },
    [height, currentOffset],
  );
  const chipStats = worldStats(viewWorld, stars);

  // A world picked on the globe arrives as a param; otherwise come back to the current stop
  const focusWorld = route.params?.focusWorld;
  const focusWorldRef = useRef(focusWorld);
  focusWorldRef.current = focusWorld;
  useEffect(() => {
    if (!focusWorld) return;
    setFocus(f => ({ level: (focusWorld - 1) * LEVELS_PER_WORLD + 1, seq: f.seq + 1 }));
    navigation.setParams({ focusWorld: undefined });
  }, [focusWorld, navigation]);

  useFocusEffect(
    useCallback(() => {
      AudioManager.startMusic('map');
      if (!focusWorldRef.current) setFocus(f => ({ level: mapLevel, seq: f.seq + 1 }));
    }, [mapLevel]),
  );

  const openLevel = useCallback(
    (levelId: number) => {
      const { currentLevel: reached, stars: won, boughtWorlds } = useProgress.getState();
      if (!isLevelOpen(levelId, reached, won, boughtWorlds)) {
        AudioManager.playLocked();
        const inBought = boughtWorlds.includes(Math.ceil(levelId / LEVELS_PER_WORLD));
        setToast({ text: t('map.finishFirst', { n: inBought ? levelId - 1 : reached }) });
        return;
      }
      AudioManager.playButtonTap();
      navigation.navigate('Level', { levelId });
    },
    [navigation, t],
  );

  const classicPlay = currentLevel > SHIPPED_LEVELS;

  return (
    <View style={styles.container}>
      <RouteMap
        currentLevel={mapLevel}
        stars={stars}
        reduceMotion={reduceMotion}
        focus={focus}
        scrollY={scrollY}
        onPressLevel={openLevel}
      />
      <MapClouds scrollY={scrollY} reduceMotion={reduceMotion} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('map.shopA11y')} onPress={() => setShopOpen(true)}>
          <CoinPill coins={coins} />
        </TouchableOpacity>
        <View
          style={styles.worldChip}
          accessible
          accessibilityLabel={t('map.worldChip', {
            n: viewWorld,
            world: t(worldKey(viewWorld)),
            done: chipStats.levelsDone,
            total: chipStats.total,
          })}
        >
          <View style={styles.worldNo}>
            <Text style={styles.worldNoText}>{viewWorld}</Text>
          </View>
          <View style={styles.worldCol}>
            <Text style={styles.worldName} numberOfLines={1}>
              {t(worldKey(viewWorld))}
            </Text>
            <View style={styles.worldBar}>
              <View style={[styles.worldBarFill, { width: `${(chipStats.levelsDone / chipStats.total) * 100}%` }]} />
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <IconButton icon="📅" label={t('map.daily')} onPress={() => setDailyOpen(true)} />
          <View style={styles.gap} />
          <IconButton icon="⚙" label={t('map.settings')} onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>

      <View style={[styles.quiz, { bottom: insets.bottom + 96 }]}>
        <QuizButton onPress={() => navigation.navigate('Quiz')} />
      </View>

      {awayFromCurrent && (
        <View style={[styles.jump, { bottom: insets.bottom + 96 }]}>
          <IconButton
            icon="📍"
            label={t('map.jumpCurrent')}
            onPress={() => setFocus(f => ({ level: mapLevel, seq: f.seq + 1 }))}
          />
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <IconButton icon="🗺️" label={t('map.globe')} onPress={() => navigation.navigate('Globe')} />
        <PrimaryButton
          label={t(classicPlay ? 'map.classic' : 'map.play', { n: currentLevel })}
          variant="coral"
          onPress={() => navigation.navigate('Level', { levelId: currentLevel })}
        />
        <IconButton icon="📘" label={t('map.album')} onPress={() => navigation.navigate('Album')} />
      </View>

      <DailyCalendarModal
        visible={dailyOpen}
        onClose={() => setDailyOpen(false)}
        onPlayDaily={() => navigation.navigate('Level', { levelId: DAILY_LEVEL_ID })}
      />
      <ShopModal visible={shopOpen} onClose={() => setShopOpen(false)} />
      {/* the bottom bar holds the Play button, so messages show at the top */}
      <Toast toast={toast} placement="top" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCream,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31,42,55,0.1)',
  },
  worldChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginHorizontal: 8,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(31,42,55,0.12)',
  },
  worldNo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryOcean,
  },
  worldNoText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.bgCream,
  },
  worldCol: {
    flex: 1,
  },
  worldName: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  worldBar: {
    height: 6,
    marginTop: 4,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E8DFD0',
  },
  worldBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accentCoral,
  },
  quiz: {
    position: 'absolute',
    left: sizes.gutter,
  },
  jump: {
    position: 'absolute',
    right: sizes.gutter,
  },
  row: {
    flexDirection: 'row',
  },
  gap: {
    width: 10,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.gutter,
  },
  modalText: {
    fontSize: fontSizes.ui[1],
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
});
