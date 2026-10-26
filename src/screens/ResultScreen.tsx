import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import type { ScreenProps } from '../app/navigation';
import { DAILY_LEVEL_ID } from '../game/levels/levelRepo';
import { WORLDS } from '../game/levels/worlds';
import { landmarkAt, landmarkKey, LANDMARKS_PER_WORLD, worldLandmarks } from '../map/landmarkPlan';
import { useProgress } from '../store/progress';
import { AdsManager } from '../services/ads/AdsManager';
import { useWallet } from '../store/wallet';
import { LandmarkArt } from '../ui/LandmarkArt';
import { PassportStamp } from '../ui/PassportStamp';
import { PostcardModal } from '../ui/PostcardModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { StarRow } from '../ui/StarRow';
import { colors, fonts } from '../ui/theme';
import { useT, worldKey } from '../i18n';

export function ResultScreen({ navigation, route }: ScreenProps<'Result'>) {
  const t = useT();
  const { levelId, stars, coins, worldCompleted, newLandmark } = route.params;
  const [stampOpen, setStampOpen] = useState(worldCompleted !== null);
  // A world finale already shows the world stamp, so the landmark postcard is for levels 15, 30 and 45
  const landmark = newLandmark && !worldCompleted ? landmarkAt(levelId) : null;
  const [landmarkOpen, setLandmarkOpen] = useState(landmark !== null);
  const [earnedCoins, setEarnedCoins] = useState(coins);
  const [doubled, setDoubled] = useState(false);
  const world = worldCompleted ? WORLDS[worldCompleted - 1] : null;

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

  return (
    <Screen>
      <Text style={styles.title}>
        {levelId === DAILY_LEVEL_ID ? t('result.dailyDone') : t('result.levelDone', { n: levelId })}
      </Text>
      <Animated.View entering={ZoomIn.delay(150)} style={styles.stars}>
        <StarRow stars={stars} size={56} />
      </Animated.View>

      <View style={styles.coins} accessibilityLabel={t('result.coinsA11y', { n: earnedCoins })}>
        <View style={styles.coinDot} />
        <Text style={styles.coinText}>+{earnedCoins}</Text>
      </View>

      {!doubled && earnedCoins > 0 && (
        <View style={styles.btnRow}>
          <PrimaryButton
            label={t('result.double')}
            variant="ocean"
            onPress={handleDoubleCoins}
          />
          <View style={styles.gap} />
        </View>
      )}

      {/* The flow returns to the map after every level */}
      <PrimaryButton label={t('common.continue')} variant="coral" onPress={handleContinue} />

      {world && (
        <PostcardModal
          visible={stampOpen}
          title={t('result.worldDone', { world: t(worldKey(world.id)) })}
          buttonLabel={t('result.addToPassport')}
          onClose={() => setStampOpen(false)}
        >
          <PassportStamp
            world={world}
            collected
            size={170}
            visited={worldLandmarks(world.id).map(l => Boolean(useProgress.getState().stars[l.levelId]))}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  stars: {
    marginVertical: 24,
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  coinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: colors.coinGold,
  },
  coinText: {
    fontSize: 28,
    fontFamily: fonts.uiBold,
    color: colors.ink,
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
  btnRow: {
    alignSelf: 'stretch',
  },
  gap: {
    height: 12,
  },
});
