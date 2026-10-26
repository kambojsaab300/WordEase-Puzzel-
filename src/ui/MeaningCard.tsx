import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, fonts } from './theme';

const AUTO_CLOSE_MS = 3000;

type Props = {
  word: string;
  meaning: string;
  onClose: () => void;
};

// Small card under the grid with the meaning of a found word; closes itself after 3 s
export function MeaningCard({ word, meaning, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [word, onClose]);

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.wrap}>
      <Pressable
        onPress={onClose}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${word}: ${meaning}. Tap to close.`}
      >
        <Text style={styles.word}>{word}</Text>
        <Text style={styles.meaning}>{meaning}</Text>
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
