import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from './theme';
import { useT } from '../i18n';

export function CoinPill({ coins }: { coins: number }) {
  const t = useT();
  return (
    <View style={styles.pill} accessibilityLabel={t('common.coins', { n: coins })}>
      <View style={styles.coin} />
      <Text style={styles.text}>{coins.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.coinGold,
  },
  coin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: colors.coinGold,
  },
  text: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
});
