import { ReactNode } from 'react';
import { ModalScroll } from './ModalScroll';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, fonts, sizes } from './theme';

type Props = {
  visible: boolean;
  title: string;
  children?: ReactNode;
  buttonLabel?: string;
  onClose: () => void;
};

// Paper-postcard style dialog
export function PostcardModal({ visible, title, children, buttonLabel = 'OK', onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <ModalScroll style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.stampLine} />
          <Text style={styles.title}>{title}</Text>
          <View style={styles.body}>{children}</View>
          <PrimaryButton label={buttonLabel} variant="coral" onPress={onClose} />
        </View>
      </ModalScroll>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 55, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizes.gutter,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.bgCream,
    borderWidth: 3,
    borderColor: colors.primaryOcean,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  stampLine: {
    width: 64,
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: colors.accentCoral,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    marginVertical: 20,
    alignItems: 'center',
  },
});
