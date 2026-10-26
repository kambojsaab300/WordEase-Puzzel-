import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import type { ScreenProps } from '../app/navigation';
import { DAILY_LEVEL_ID } from '../game/levels/levelRepo';
import { WORLDS } from '../game/levels/worlds';
import { AdsManager } from '../services/ads/AdsManager';
import { useWallet } from '../store/wallet';
import { PassportStamp } from '../ui/PassportStamp';
import { PostcardModal } from '../ui/PostcardModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { StarRow } from '../ui/StarRow';
import { colors, fonts } from '../ui/theme';

export function ResultScreen({ navigation, route }: ScreenProps<'Result'>) {
  const { levelId, stars, coins, worldCompleted } = route.params;
  const [stampOpen, setStampOpen] = useState(worldCompleted !== null);
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
        {levelId === DAILY_LEVEL_ID ? 'Daily Postcard Complete!' : `Level ${levelId} complete!`}
      </Text>
      <Animated.View entering={ZoomIn.delay(150)} style={styles.stars}>
        <StarRow stars={stars} size={56} />
      </Animated.View>

      <View style={styles.coins} accessibilityLabel={`${earnedCoins} coins earned`}>
        <View style={styles.coinDot} />
        <Text style={styles.coinText}>+{earnedCoins}</Text>
      </View>

      {!doubled && earnedCoins > 0 && (
        <View style={styles.btnRow}>
          <PrimaryButton
            label="Double Coins (x2 🪙)"
            variant="ocean"
            onPress={handleDoubleCoins}
          />
          <View style={styles.gap} />
        </View>
      )}

      {/* The flow returns to the map after every level */}
      <PrimaryButton label="Continue" variant="coral" onPress={handleContinue} />

      {world && (
        <PostcardModal
          visible={stampOpen}
          title={`${world.name} complete!`}
          buttonLabel="Add to passport"
          onClose={() => setStampOpen(false)}
        >
          <PassportStamp world={world} collected size={170} />
          <Text style={styles.stampNote}>New passport stamp · includes +150 coins</Text>
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
  btnRow: {
    alignSelf: 'stretch',
  },
  gap: {
    height: 12,
  },
});
