import { Modal, StyleSheet, Text, View } from 'react-native';
import { ModalScroll } from './ModalScroll';
import { useT } from '../i18n';
import { PrimaryButton } from './PrimaryButton';
import { colors, fonts, sizes } from './theme';

type Props = {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMap: () => void;
};

// Pause menu from the flow: Resume, Restart, Settings, Map
export function PauseSheet({ visible, onResume, onRestart, onSettings, onMap }: Props) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onResume}>
      <ModalScroll style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {t('pause.title')}
          </Text>
          <PrimaryButton label={t('pause.resume')} variant="coral" onPress={onResume} />
          <View style={styles.gap} />
          <PrimaryButton label={t('pause.restart')} onPress={onRestart} />
          <View style={styles.gap} />
          <PrimaryButton label={t('map.settings')} onPress={onSettings} />
          <View style={styles.gap} />
          <PrimaryButton label={t('pause.map')} onPress={onMap} />
          <Text style={styles.note}>{t('pause.saved')}</Text>
        </View>
      </ModalScroll>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizes.gutter,
    backgroundColor: 'rgba(31, 42, 55, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.bgCream,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.primaryOcean,
  },
  title: {
    marginBottom: 20,
    fontSize: 30,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  gap: {
    height: 12,
  },
  note: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
});
