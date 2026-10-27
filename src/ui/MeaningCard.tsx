import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTextSize } from './a11y';
import { colors, fonts } from './theme';
import { useT } from '../i18n';
import { withTap } from './withTap';

const AUTO_CLOSE_MS = 3000;

type Props = {
  word: string;
  meaning: string;
  onClose: () => void;
};

// Word title / meaning text sizes for Normal, Large, Huge
const WORD_SIZE = [22, 26, 30];
const MEANING_SIZE = [19, 23, 27];

// Small card under the grid with the meaning of a found word; closes itself after 3 s
export function MeaningCard({ word, meaning, onClose }: Props) {
  const size = useTextSize();
  const t = useT();
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [word, onClose]);

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.wrap}>
      <Pressable
        onPress={withTap(onClose)}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={t('meaning.a11y', { word, meaning })}
      >
        <Text style={[styles.word, { fontSize: WORD_SIZE[size] }]}>{word}</Text>
        <Text style={[styles.meaning, { fontSize: MEANING_SIZE[size], lineHeight: MEANING_SIZE[size] * 1.35 }]}>
          {meaning}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
    borderStyle: 'dashed',
  },
  word: {
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  meaning: {
    marginTop: 4,
    fontSize: 19,
    lineHeight: 26,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});
