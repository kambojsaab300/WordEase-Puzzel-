import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { colors, sizes } from './theme';

// Ocean for everyday actions, gold for the ones that cost coins (hints)
const TONES = {
  ocean: { face: colors.paper, border: colors.primaryOcean, edge: '#0A5269' },
  gold: { face: '#FFF4CC', border: '#E0A400', edge: '#C28E00' },
} as const;

// How far the darker edge shows under the face; pressing pushes the face down onto it
const EDGE = 3;

type Props = {
  /** An emoji, or a drawn icon from GameIcons */
  icon: ReactNode;
  label: string; // TalkBack label
  onPress: () => void;
  tone?: keyof typeof TONES;
};

export function IconButton({ icon, label, onPress, tone = 'ocean' }: Props) {
  const look = TONES[tone];
  const handlePress = () => {
    AudioManager.playButtonTap();
    HapticsManager.buttonTap();
    onPress();
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={handlePress} style={styles.button}>
      {({ pressed }) => (
        <>
          <View style={[styles.circle, styles.edge, { backgroundColor: look.edge }]} />
          <View
            style={[
              styles.circle,
              styles.face,
              { backgroundColor: look.face, borderColor: look.border },
              pressed && styles.facePressed,
            ]}
          >
            {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : icon}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget + EDGE,
  },
  circle: {
    position: 'absolute',
    left: 0,
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: sizes.touchTarget / 2,
  },
  // lifts off the table like the postcards
  edge: {
    top: EDGE,
    elevation: 3,
    shadowColor: '#503214',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  face: {
    top: 0,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Android stacks by elevation: match the edge so the face, drawn later, stays on top
    elevation: 3,
  },
  facePressed: {
    top: EDGE - 1,
  },
  icon: {
    fontSize: 24,
    color: colors.primaryOcean,
  },
});
