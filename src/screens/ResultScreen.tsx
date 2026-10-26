import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScreenProps } from '../app/navigation';
import { celebrationFor } from '../game/engine/celebration';
import { DAILY_LEVEL_ID } from '../game/levels/levelRepo';
import { WORLDS } from '../game/levels/worlds';
import { landmarkAt, landmarkKey, LANDMARKS_PER_WORLD, worldLandmarks } from '../map/landmarkPlan';
import { LANDMARK_PATHS } from '../map/landmarks';
import { AdsManager } from '../services/ads/AdsManager';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { Confetti } from '../ui/Confetti';
import { LandmarkArt } from '../ui/LandmarkArt';
import { PassportStamp } from '../ui/PassportStamp';
import { PostcardModal } from '../ui/PostcardModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { colors, fonts, sizes } from '../ui/theme';
import { useT, worldKey } from '../i18n';

const STAR_SIZE = 58;

export function ResultScreen({ navigation, route }: ScreenProps<'Result'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const reduceMotion = useSettings(s => s.reduceMotion);
  const { levelId, stars, coins, worldCompleted, newLandmark } = route.params;
  const daily = levelId === DAILY_LEVEL_ID;
  const party = useMemo(
    () => celebrationFor(levelId, stars, { daily, currentLevel: useProgress.getState().currentLevel }),
    [levelId, stars, daily],
  );
  const { world, milestone } = party;

  const [stampOpen, setStampOpen] = useState(worldCompleted !== null);
  // A world finale already shows the world stamp, so the landmark postcard is for levels 15, 30 and 45
  const landmark = newLandmark && !worldCompleted ? landmarkAt(levelId) : null;
  const [landmarkOpen, setLandmarkOpen] = useState(landmark !== null);
  const [earnedCoins, setEarnedCoins] = useState(coins);
  const [doubled, setDoubled] = useState(false);
  const stampWorld = worldCompleted ? WORLDS[worldCompleted - 1] : null;
  // The postcard shows this level's landmark when there is one, else the world's signature sight
  const art = (!daily && landmarkAt(levelId)?.path) || LANDMARK_PATHS[world.landmark];
  const worldName = t(worldKey(world.id));

  const handleContinue = () => {
    if (AdsManager.shouldShowInterstitial(levelId)) {
      AdsManager.recordInterstitialShown();
    }
    navigation.popTo('Map');
  };

  const handleDoubleCoins = async () => {
    await AdsManager.showRewardedAd(() => {
      useWallet.getState().add(earnedCoins);
      setEarnedCoins(prev => prev * 2);
      setDoubled(true);
    });
  };

  const enter = <T,>(anim: T) => (reduceMotion ? undefined : anim);

  return (
    <View style={[styles.root, { backgroundColor: world.palette.sky }]}>
      {/* soft paper sun and hills behind the postcard */}
      <View style={[styles.sun, { backgroundColor: world.palette.far }]} />
      <View style={[styles.hill, styles.hillBack, { backgroundColor: world.palette.mid }]} />
      <View style={[styles.hill, styles.hillFront, { backgroundColor: world.palette.near }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={enter(ZoomIn.springify().damping(12))}
          style={[styles.postcard, { borderColor: world.palette.accent }]}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${t(party.cheerKey)} ${t(party.meaningKey)}. ${
            daily ? t('result.dailyDone') : t('result.levelDone', { n: levelId })
          }`}
        >
          <View style={[styles.chip, { backgroundColor: world.palette.accent }]}>
            <Text style={styles.chipText} numberOfLines={1}>
              {daily ? t('result.dailyDone') : `${t('common.level', { n: levelId })} · ${worldName}`}
            </Text>
          </View>
          <View style={[styles.artBox, { backgroundColor: world.palette.far }]}>
            <LandmarkArt path={art} color={world.palette.accent} size={120} />
            <View style={[styles.postmark, { borderColor: world.palette.accent }]}>
              <Text style={[styles.postmarkText, { color: world.palette.accent }]}>{world.id}</Text>
            </View>
          </View>
          <Text style={styles.cheer} adjustsFontSizeToFit numberOfLines={1}>
            {t(party.cheerKey)}
          </Text>
          <Text style={styles.meaning}>{t(party.meaningKey)}</Text>
        </Animated.View>

        <View style={styles.starRow} accessible accessibilityLabel={t('common.stars', { n: stars })}>
          {[1, 2, 3].map(i => (
            <Animated.Text
              key={i}
              entering={enter(ZoomIn.delay(350 + i * 220).springify().damping(9))}
              style={[styles.star, i <= stars ? styles.starOn : styles.starOff, i === 2 && styles.starMiddle]}
            >
              ★
            </Animated.Text>
          ))}
        </View>

        <Animated.View entering={enter(FadeInDown.delay(1000))} style={styles.lines}>
          <Text style={styles.starsLine}>{t(party.starsLineKey)}</Text>
          <Text style={styles.funLine}>{t(party.funLineKey, { world: worldName })}</Text>
        </Animated.View>

        {milestone && (
          <Animated.View
            entering={enter(ZoomIn.delay(1250).springify().damping(10))}
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

        <Animated.View
          entering={enter(FadeInDown.delay(1400))}
          style={styles.coins}
          accessible
          accessibilityLabel={t('result.coinsA11y', { n: earnedCoins })}
        >
          <View style={styles.coinDot} />
          <Text style={styles.coinText}>+{earnedCoins}</Text>
        </Animated.View>

        <View style={styles.buttons}>
          {!doubled && earnedCoins > 0 && (
            <>
              <PrimaryButton label={t('result.double')} variant="ocean" onPress={handleDoubleCoins} />
              <View style={styles.gap} />
            </>
          )}
          {/* The flow returns to the map after every level */}
          <PrimaryButton label={t('common.continue')} variant="coral" onPress={handleContinue} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.7,
  },
  hill: {
    position: 'absolute',
    width: '160%',
    height: 260,
    borderRadius: 400,
  },
  hillBack: {
    bottom: -150,
    left: '-50%',
    opacity: 0.55,
  },
  hillFront: {
    bottom: -190,
    left: '-5%',
    opacity: 0.45,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.gutter,
  },
  postcard: {
    width: '100%',
    maxWidth: 400,
    paddingTop: 30,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 3,
    borderStyle: 'dashed',
    backgroundColor: colors.bgCream,
    alignItems: 'center',
    transform: [{ rotate: '-1.5deg' }],
    elevation: 6,
  },
  chip: {
    position: 'absolute',
    top: -16,
    maxWidth: '90%',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  artBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  postmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  postmarkText: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
  },
  cheer: {
    marginTop: 12,
    fontSize: 42,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  meaning: {
    fontSize: 17,
    fontFamily: fonts.ui,
    color: '#4B5563',
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  star: {
    marginHorizontal: 6,
    fontSize: STAR_SIZE,
    textShadowColor: 'rgba(31,42,55,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 3,
  },
  starMiddle: {
    fontSize: STAR_SIZE * 1.25,
    marginBottom: 8,
  },
  starOn: {
    color: colors.coinGold,
  },
  starOff: {
    color: '#D9D2C3',
  },
  lines: {
    alignItems: 'center',
    marginTop: 6,
  },
  starsLine: {
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  funLine: {
    marginTop: 4,
    fontSize: 18,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    maxWidth: 420,
    marginTop: 16,
    paddingVertical: 12,
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
    fontSize: 40,
    marginRight: 12,
  },
  ribbonTextCol: {
    flex: 1,
  },
  ribbonTitle: {
    fontSize: 21,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  ribbonLine: {
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: colors.white,
    elevation: 2,
  },
  coinDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: colors.coinGold,
  },
  coinText: {
    fontSize: 30,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  buttons: {
    alignSelf: 'stretch',
    maxWidth: 420,
    width: '100%',
    marginTop: 20,
  },
  gap: {
    height: 12,
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
