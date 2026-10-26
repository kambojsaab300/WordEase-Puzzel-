import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdsManager } from '../services/ads/AdsManager';
import { getTodayKey } from '../store/daily';
import { useWallet } from '../store/wallet';
import { CoinPill } from './CoinPill';
import { IconButton } from './IconButton';
import { PrimaryButton } from './PrimaryButton';
import { colors, fonts } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ShopModal({ visible, onClose }: Props) {
  const coins = useWallet(s => s.coins);
  const adFree = useWallet(s => s.adFree);
  const addCoins = useWallet(s => s.add);
  const setAdFree = useWallet(s => s.setAdFree);

  const todayKey = getTodayKey();
  const [canClaimFree, setCanClaimFree] = useState(AdsManager.canClaimFreeCoins(todayKey));

  // TEST BUILD: no Google Play Billing yet (T29), so nothing is charged
  const handleRemoveAds = () => {
    setAdFree(true);
    Alert.alert('Test purchase', 'Ads removed. No payment was taken (test build).');
  };

  const handleBuyCoins = (amount: number, price: string) => {
    addCoins(amount);
    Alert.alert('Test purchase', `+${amount} coins (${price} pack). No payment was taken (test build).`);
  };

  const handleWatchAd = async () => {
    if (!AdsManager.canClaimFreeCoins(todayKey)) {
      Alert.alert('Daily Limit', 'You have reached the maximum 5 free coin rewards for today. Come back tomorrow!');
      return;
    }

    await AdsManager.showRewardedAd(() => {
      addCoins(50);
      AdsManager.recordFreeCoinsClaimed(todayKey);
      setCanClaimFree(AdsManager.canClaimFreeCoins(todayKey));
      Alert.alert('Reward Earned', '+50 coins added to your wallet!');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Coin Shop</Text>
            <IconButton icon="✕" label="Close Shop" onPress={onClose} />
          </View>

          <Text style={styles.testNote}>Test build: no real payments or ads yet</Text>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your Balance:</Text>
            <CoinPill coins={coins} />
          </View>

          {/* Remove Ads Item */}
          <View style={styles.productCard}>
            <View style={styles.productLeft}>
              <Text style={styles.productName}>🚫 Remove Ads</Text>
              <Text style={styles.productSub}>No banner, interstitial or pop-up ads</Text>
            </View>
            {adFree ? (
              <View style={styles.purchasedBadge}>
                <Text style={styles.purchasedText}>Active ✓</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.priceBtn} onPress={handleRemoveAds}>
                <Text style={styles.priceText}>$3.99</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Free coins via rewarded ad */}
          <View style={styles.productCard}>
            <View style={styles.productLeft}>
              <Text style={styles.productName}>🎁 Free 50 Coins</Text>
              <Text style={styles.productSub}>Watch a short video sponsor</Text>
            </View>
            <TouchableOpacity
              style={[styles.priceBtn, !canClaimFree && styles.priceBtnDisabled]}
              onPress={handleWatchAd}
            >
              <Text style={styles.priceText}>{canClaimFree ? 'Watch Ad' : 'Limit'}</Text>
            </TouchableOpacity>
          </View>

          {/* Coin Packs */}
          <View style={styles.productCard}>
            <View style={styles.productLeft}>
              <Text style={styles.productName}>🪙 500 Coins</Text>
              <Text style={styles.productSub}>Handy bundle for hints</Text>
            </View>
            <TouchableOpacity style={styles.priceBtn} onPress={() => handleBuyCoins(500, '$0.99')}>
              <Text style={styles.priceText}>$0.99</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productLeft}>
              <Text style={styles.productName}>💎 2,000 Coins</Text>
              <Text style={styles.productSub}>Best value for long journeys</Text>
            </View>
            <TouchableOpacity style={styles.priceBtn} onPress={() => handleBuyCoins(2000, '$2.99')}>
              <Text style={styles.priceText}>$2.99</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <PrimaryButton label="Done" variant="ocean" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  testNote: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.accentCoral,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgCream,
    borderRadius: 24,
    padding: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  productLeft: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 2,
  },
  productSub: {
    fontSize: 12,
    fontFamily: fonts.ui,
    color: '#6B7280',
  },
  priceBtn: {
    backgroundColor: colors.primaryOcean,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  priceBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  priceText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  purchasedBadge: {
    backgroundColor: '#E0F2E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  purchasedText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.okGreen,
  },
  footer: {
    marginTop: 10,
  },
});
