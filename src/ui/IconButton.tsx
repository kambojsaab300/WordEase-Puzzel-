import { Pressable, StyleSheet, Text } from 'react-native';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { colors, sizes } from './theme';

type Props = {
  icon: string;
  label: string; // TalkBack label
  onPress: () => void;
};

export function IconButton({ icon, label, onPress }: Props) {
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
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: sizes.touchTarget / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 24,
    color: colors.primaryOcean,
  },
});
