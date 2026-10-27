import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScreenProps } from '../app/navigation';
import { POSTCARD_ASSETS, type WorldId } from '../assets/postcards';
import { celebrationFor } from '../game/engine/celebration';
import { DAILY_LEVEL_ID } from '../game/levels/levelRepo';
import { WORLDS } from '../game/levels/worlds';
import { landmarkAt, landmarkKey, LANDMARKS_PER_WORLD, worldLandmarks } from '../map/landmarkPlan';
import { AdsManager } from '../services/ads/AdsManager';
import { AudioManager } from '../services/audio/AudioManager';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { Backdrop } from '../ui/celebration/Backdrop';
import { CelebrationPostcard } from '../ui/celebration/CelebrationPostcard';
import { CoinIcon, Star3D } from '../ui/celebration/Star3D';
import { Confetti } from '../ui/Confetti';
import { LandmarkArt } from '../ui/LandmarkArt';
import { PassportStamp } from '../ui/PassportStamp';
import { PostcardModal } from '../ui/PostcardModal';
import { colors, fonts } from '../ui/theme';
import { useT, worldKey } from '../i18n';

// Positions of the three stars on the 390-wide design artboard
const STARS = [
  { left: 62, top: 46, size: 84, tilt: -14, delay: 800 },
  { left: 136, top: 0, size: 118, tilt: 0, delay: 1150 },
  { left: 244, top: 46, size: 84, tilt: 14, delay: 1500 },
];
const TITLE_DEPTH = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const TITLE_SIDE = [7, 6, 5, 4, 3, 2, 1];
const COIN_DEPTH: [number, string][] = [
  [6, '#A64B10'],
  [5, '#A64B10'],
  [4, '#B8561A'],
  [3, '#B8561A'],
  [2, '#C2631A'],
  [1, '#C2631A'],
];

export function ResultScreen({ navigation, route }: ScreenProps<'Result'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const u = Math.min(width, 480) / 390;
  const reduceMotion = useSettings(s => s.reduceMotion);
  const { levelId, stars, coins, worldCompleted, newLandmark } = route.params;
  const daily = levelId === DAILY_LEVEL_ID;
  const party = useMemo(
    () => celebrationFor(levelId, stars, { daily, currentLevel: useProgress.getState().currentLevel }),
    [levelId, stars, daily],
  );
  const { world, milestone } = party;

  const [stampOpen, setStampOpen] = useState(worldCompleted !== null);

  // No background music over the celebration. Each earned star dings as it pops (at its peak),
  // coins chime as their row rises in (2.1 s), and a world finale stamps the passport first.
  useEffect(() => {
    AudioManager.stopMusic();
    if (worldCompleted !== null) AudioManager.playStampThump();
    const timers = STARS.slice(0, stars).map((s, i) =>
      setTimeout(() => AudioManager.playStar(i), reduceMotion ? 150 * i : s.delay + 400),
    );
    timers.push(setTimeout(() => AudioManager.playCoinGain(), reduceMotion ? 500 : 2200));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the screen opens
  }, []);
  // A world finale already shows the world stamp, so the landmark postcard is for levels 15, 30 and 45
  const landmark = newLandmark && !worldCompleted ? landmarkAt(levelId) : null;
  const [landmarkOpen, setLandmarkOpen] = useState(landmark !== null);
  const [earnedCoins, setEarnedCoins] = useState(coins);
  const [doubled, setDoubled] = useState(false);
  const stampWorld = worldCompleted ? WORLDS[worldCompleted - 1] : null;
  const worldName = t(worldKey(world.id));
  const cheer = t(party.cheerKey);

  // A world finale or the daily puzzle goes back to the map; otherwise straight on to the next level
  const toMap = daily || worldCompleted !== null;

  const handleNext = () => {
    if (AdsManager.shouldShowInterstitial(levelId)) {
      AdsManager.recordInterstitialShown();
    }
    if (toMap) navigation.popTo('Map');
    else navigation.replace('Level', { levelId: levelId + 1 });
  };

  const handleDoubleCoins = async () => {
    await AdsManager.showRewardedAd(() => {
      useWallet.getState().add(earnedCoins);
      AudioManager.playCoinGain();
      setEarnedCoins(prev => prev * 2);
      setDoubled(true);
    });
  };

  const enter = <T,>(anim: T) => (reduceMotion ? undefined : anim);
  const titleSize = 41 * u;
  const starsTop = insets.top + 176 * u;

  return (
    <View style={styles.root}>
      <Backdrop width={width} height={height} centerY={starsTop + 80 * u} reduceMotion={reduceMotion} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 * u, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${cheer} ${t(party.meaningKey)}. ${
            daily ? t('result.dailyDone') : t('result.levelDone', { n: levelId })
          }`}
          style={styles.header}
        >
          <Animated.View entering={enter(FadeInDown.delay(100))} style={styles.levelPill}>
            <Text style={[styles.levelText, { fontSize: 17 * u }]} numberOfLines={1}>
              {daily ? t('result.dailyDone') : `${t('common.level', { n: levelId })} · ${worldName}`}
            </Text>
          </Animated.View>

          {/* 3D title: dark base, coral sides, bright face */}
          <Animated.View
            entering={enter(ZoomIn.delay(150).springify().damping(9))}
            style={[styles.title, { width: 366 * u, height: titleSize * 1.6 }]}
            importantForAccessibility="no-hide-descendants"
          >
            {TITLE_DEPTH.map(d => (
              <Text key={`d${d}`} style={[styles.titleText, styles.titleBase, { fontSize: titleSize, top: d }]} numberOfLines={1} adjustsFontSizeToFit>
                {cheer}
              </Text>
            ))}
            {TITLE_SIDE.map(d => (
              <Text key={`s${d}`} style={[styles.titleText, styles.titleSide, { fontSize: titleSize, top: d }]} numberOfLines={1} adjustsFontSizeToFit>
                {cheer}
              </Text>
            ))}
            <Text style={[styles.titleText, styles.titleFace, { fontSize: titleSize }]} numberOfLines={1} adjustsFontSizeToFit>
              {cheer}
            </Text>
          </Animated.View>
          <Text style={[styles.meaning, { fontSize: 17 * u }]}>{t(party.meaningKey)}</Text>
        </View>

        <View
          style={[styles.stars, { width: 390 * u, height: 140 * u }]}
          accessible
          accessibilityLabel={t('common.stars', { n: stars })}
        >
          {STARS.map((s, i) => (
            <View key={s.left} style={[styles.star, { left: s.left * u, top: s.top * u }]}>
              <Star3D on={i < stars} size={s.size * u} tilt={s.tilt} delayMs={s.delay} reduceMotion={reduceMotion} />
            </View>
          ))}
        </View>
        <Text style={[styles.starsLine, { fontSize: 18 * u }]}>{t(party.starsLineKey)}</Text>

        <Animated.View entering={enter(FadeInDown.delay(600))} style={styles.postcard}>
          <CelebrationPostcard
            worldId={world.id}
            width={312 * u}
            reduceMotion={reduceMotion}
            accessibilityLabel={worldName}
          />
        </Animated.View>

        <Animated.View
          entering={enter(FadeInDown.delay(2100))}
          style={styles.coins}
          accessible
          accessibilityLabel={t('result.coinsA11y', { n: earnedCoins })}
        >
          <CoinIcon size={46 * u} />
          <View importantForAccessibility="no-hide-descendants">
            {COIN_DEPTH.map(([d, c]) => (
              <Text key={d} style={[styles.coinText, styles.coinDepth, { fontSize: 46 * u, top: d, color: c }]}>
                +{earnedCoins}
              </Text>
            ))}
            <Text style={[styles.coinText, { fontSize: 46 * u }]}>+{earnedCoins}</Text>
          </View>
        </Animated.View>

        {milestone && (
          <Animated.View
            entering={enter(ZoomIn.delay(2300).springify().damping(10))}
            style={[styles.ribbon, milestone.kind !== 'ten' && styles.ribbonBig]}
            accessible
            accessibilityLabel={`${t(milestone.titleKey, { n: milestone.n, world: worldName })}. ${t(milestone.lineKey)}`}
          >
            <Text style={styles.badge}>{milestone.badge}</Text>
            <View style={styles.ribbonTextCol}>
              <Text style={styles.ribbonTitle}>{t(milestone.titleKey, { n: milestone.n, world: worldName })}</Text>
              <Text style={styles.ribbonLine}>{t(milestone.lineKey)}</Text>
            </View>
          </Animated.View>
        )}

        <View style={[styles.buttons, { width: 300 * u }]}>
          {!doubled && earnedCoins > 0 && (
            <Animated.View entering={enter(FadeInDown.delay(2500))}>
              <Button3D
                label={t('result.double')}
                icon="▶"
                height={56 * u}
                fontSize={22 * u}
                face="#F26A4C"
                top="#FF8C6E"
                base="#9E2C17"
                onPress={handleDoubleCoins}
              />
            </Animated.View>
          )}
          <Animated.View entering={enter(FadeInDown.delay(2700))} style={styles.gap}>
            <Button3D
              label={t(toMap ? 'common.continue' : 'result.nextLevel')}
              height={62 * u}
              fontSize={27 * u}
              face="#2AA84A"
              top="#3CC45C"
              base="#0F5F26"
              onPress={handleNext}
            />
          </Animated.View>
        </View>
      </ScrollView>

      {!reduceMotion && <Confetti colors={party.confetti} seed={levelId * 31 + stars} />}

      {stampWorld && (
        <PostcardModal
          visible={stampOpen}
          title={t('result.worldDone', { world: t(worldKey(stampWorld.id)) })}
          buttonLabel={t('result.addToPassport')}
          onClose={() => setStampOpen(false)}
        >
          {POSTCARD_ASSETS[stampWorld.id as WorldId] && (
            <Image
              source={POSTCARD_ASSETS[stampWorld.id as WorldId].color}
              style={styles.worldPostcard}
              accessibilityIgnoresInvertColors
            />
          )}
          <PassportStamp
            world={stampWorld}
            collected
            size={170}
            visited={worldLandmarks(stampWorld.id).map(l => Boolean(useProgress.getState().stars[l.levelId]))}
          />
          <Text style={styles.stampNote}>{t('result.stampNote')}</Text>
        </PostcardModal>
      )}

      {landmark && (
        <PostcardModal
          visible={landmarkOpen}
          title={t('result.landmarkTitle', { name: t(landmarkKey(landmark.key)) })}
          buttonLabel={t('result.addToPassport')}
          onClose={() => setLandmarkOpen(false)}
        >
          <View
            style={[styles.landmarkCard, { backgroundColor: landmark.world.palette.sky }]}
            accessibilityLabel={t('landmark.visited', { name: t(landmarkKey(landmark.key)) })}
          >
            <LandmarkArt path={landmark.path} color={landmark.world.palette.accent} size={130} />
          </View>
          <Text style={styles.stampNote}>
            {t('result.landmarkNote', {
              n: landmark.index + 1,
              total: LANDMARKS_PER_WORLD,
              world: t(worldKey(landmark.world.id)),
            })}
          </Text>
        </PostcardModal>
      )}
    </View>
  );
}

type ButtonProps = {
  label: string;
  icon?: string;
  height: number;
  fontSize: number;
  face: string;
  top: string;
  base: string;
  onPress: () => void;
};

// Chunky 3D button: a darker base under a bright face that presses down
function Button3D({ label, icon, height, fontSize, face, top, base, onPress }: ButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => (
        <View style={{ height: height + 6 }}>
          <View style={[styles.btnBase, { height, backgroundColor: base }]} />
          <View style={[styles.btnFace, { height, backgroundColor: face }, pressed && styles.btnPressed]}>
            <View style={[styles.btnTop, { backgroundColor: top }]} />
            <View style={styles.btnShine} />
            <Text style={[styles.btnText, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit>
              {icon ? `${icon}  ${label}` : label}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0E6E8C',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  levelText: {
    fontFamily: fonts.uiBold,
    color: colors.white,
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 10,
  },
  titleText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    textAlign: 'center',
    fontFamily: fonts.uiBold,
    includeFontPadding: false,
  },
  titleBase: {
    color: '#5C1A0E',
  },
  titleSide: {
    color: '#E0553A',
  },
  titleFace: {
    color: '#FFE89A',
    textShadowColor: '#5C1A0E',
    textShadowRadius: 1.5,
  },
  meaning: {
    fontFamily: fonts.uiBold,
    color: '#FFF3C4',
    textAlign: 'center',
  },
  stars: {
    marginTop: 8,
  },
  star: {
    position: 'absolute',
  },
  starsLine: {
    marginTop: 4,
    fontFamily: fonts.uiBold,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,30,45,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  postcard: {
    marginTop: 20,
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
    gap: 10,
  },
  coinText: {
    fontFamily: fonts.uiBold,
    color: '#FFE27A',
    includeFontPadding: false,
  },
  coinDepth: {
    position: 'absolute',
    left: 0,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '86%',
    maxWidth: 420,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFF1C2',
    borderWidth: 2,
    borderColor: colors.coinGold,
  },
  ribbonBig: {
    backgroundColor: '#FFE38A',
    borderWidth: 3,
  },
  badge: {
    fontSize: 36,
    marginRight: 12,
  },
  ribbonTextCol: {
    flex: 1,
  },
  ribbonTitle: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  ribbonLine: {
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  buttons: {
    maxWidth: 420,
    marginTop: 22,
  },
  gap: {
    marginTop: 12,
  },
  btnBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    borderRadius: 20,
  },
  btnFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPressed: {
    top: 4,
  },
  btnTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
  },
  btnShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  btnText: {
    fontFamily: fonts.uiBold,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  worldPostcard: {
    width: '100%',
    aspectRatio: 1080 / 489,
    marginBottom: 12,
    borderRadius: 14,
  },
  stampNote: {
    marginTop: 8,
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
  landmarkCard: {
    padding: 14,
    borderRadius: 14,
  },
});
