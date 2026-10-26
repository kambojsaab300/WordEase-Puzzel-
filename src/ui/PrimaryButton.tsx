import { Pressable, StyleSheet, Text } from 'react-native';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { colors, fonts, fontSizes, sizes } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'coral' | 'ocean';
};

export function PrimaryButton({ label, onPress, variant = 'ocean' }: Props) {
  const backgroundColor = variant === 'coral' ? colors.accentCoral : colors.primaryOcean;

  const handlePress = () => {
    AudioManager.playButtonTap();
    HapticsManager.buttonTap();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.touchTarget,
    minWidth: 200,
    paddingHorizontal: 32,
    borderRadius: sizes.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  label: {
    color: colors.white,
    fontSize: fontSizes.ui[1],
    fontFamily: fonts.uiBold,
  },
});
