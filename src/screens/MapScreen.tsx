import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScreenProps } from '../app/navigation';
import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { DAILY_LEVEL_ID, SHIPPED_LEVELS } from '../game/levels/levelRepo';
import { MapClouds } from '../map/MapClouds';
import { RouteMap } from '../map/RouteMap';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { CoinPill } from '../ui/CoinPill';
import { DailyCalendarModal } from '../ui/DailyCalendarModal';
import { IconButton } from '../ui/IconButton';
import { PrimaryButton } from '../ui/PrimaryButton';
import { ShopModal } from '../ui/ShopModal';
import { Toast } from '../ui/Toast';
import { colors, fonts, fontSizes, sizes } from '../ui/theme';
import { useT } from '../i18n';

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
      if (!focusWorldRef.current) setFocus(f => ({ level: mapLevel, seq: f.seq + 1 }));
    }, [mapLevel]),
  );

  const openLevel = useCallback(
    (levelId: number) => {
      if (levelId > useProgress.getState().currentLevel) {
        setToast({ text: t('map.finishFirst', { n: useProgress.getState().currentLevel }) });
        return;
      }
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
        <View style={styles.row}>
          <IconButton icon="📅" label={t('map.daily')} onPress={() => setDailyOpen(true)} />
          <View style={styles.gap} />
          <IconButton icon="⚙" label={t('map.settings')} onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>

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
    paddingHorizontal: sizes.gutter,
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
