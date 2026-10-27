import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { getTodayKey } from '../store/daily';
import { useQuiz } from '../store/quiz';
import { colors, fonts, sizes } from './theme';
import { useT } from '../i18n';

// Map shortcut to the Daily Word Quiz; a red dot until today's quiz is done
export function QuizButton({ onPress }: { onPress: () => void }) {
  const t = useT();
  const done = useQuiz(s => s.today?.dayKey === getTodayKey() && s.today.finished);

  const handlePress = () => {
    AudioManager.playButtonTap();
    HapticsManager.buttonTap();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t(done ? 'quiz.mapA11yDone' : 'quiz.mapA11yNew')}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>🧠</Text>
      <Text style={styles.label}>{done ? `${t('quiz.mapButton')} ✓` : t('quiz.mapButton')}</Text>
      {!done && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: 16,
    borderRadius: sizes.touchTarget / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accentCoral,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 22,
    marginRight: 6,
  },
  label: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  dot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentCoral,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
