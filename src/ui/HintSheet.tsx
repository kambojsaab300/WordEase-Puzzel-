import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HINT_COST, HintKind } from '../game/engine/hints';
import { colors, fonts, sizes } from './theme';
import { TKey, useT } from '../i18n';

const OPTIONS: { kind: HintKind; title: TKey; detail: TKey }[] = [
  { kind: 'spotlight', title: 'hints.spotlight.title', detail: 'hints.spotlight.desc' },
  { kind: 'compass', title: 'hints.compass.title', detail: 'hints.compass.desc' },
  { kind: 'reveal', title: 'hints.reveal.title', detail: 'hints.reveal.desc' },
];

type Props = {
  visible: boolean;
  coins: number;
  onPick: (kind: HintKind) => void;
  onClose: () => void;
};

export function HintSheet({ visible, coins, onPick, onClose }: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('hints.closeA11y')}>
        <Pressable style={[styles.sheet, { paddingBottom: 32 + insets.bottom }]} onPress={() => {}}>
          <Text style={styles.title}>{t('hints.title')}</Text>
          <Text style={styles.balance}>{t('hints.balance', { n: coins })}</Text>

          {OPTIONS.map(o => {
            const cost = HINT_COST[o.kind];
            const affordable = coins >= cost;
            return (
              <Pressable
                key={o.kind}
                onPress={() => onPick(o.kind)}
                disabled={!affordable}
                accessibilityRole="button"
                accessibilityLabel={t('hints.optionA11y', { title: t(o.title), n: cost, desc: t(o.detail) })}
                accessibilityState={{ disabled: !affordable }}
                style={({ pressed }) => [
                  styles.option,
                  !affordable && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{t(o.title)}</Text>
                  <Text style={styles.optionDetail}>{t(o.detail)}</Text>
                </View>
                <View style={styles.cost}>
                  <View style={styles.coin} />
                  <Text style={styles.costText}>{cost}</Text>
                </View>
              </Pressable>
            );
          })}

          {coins < HINT_COST.spotlight && (
            <Text style={styles.note}>{t('hints.noCoins')}</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31, 42, 55, 0.5)',
  },
  sheet: {
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.bgCream,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  balance: {
    marginBottom: 12,
    fontSize: 18,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTarget + 16,
    marginTop: 10,
    paddingHorizontal: 16,
    borderRadius: sizes.radius,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  optionText: {
    flex: 1,
    paddingVertical: 8,
  },
  optionTitle: {
    fontSize: 21,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  optionDetail: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  cost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: colors.coinGold,
  },
  costText: {
    fontSize: 21,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  note: {
    marginTop: 14,
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
});
