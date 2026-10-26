import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes } from './theme';

type Props = {
  word: string;
  found: boolean;
  color?: string; // capsule colour of the found word
  onPress?: () => void; // found chips open the meaning card again
};

export function WordChip({ word, found, color = colors.okGreen, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, found && { borderColor: color, backgroundColor: colors.white }]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={found ? `${word}, found` : word}
    >
      {found && <Text style={[styles.tick, { color }]}>✓</Text>}
      <Text style={[styles.text, found && styles.foundText]}>{word}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    margin: 4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D9D2C3',
    backgroundColor: '#FBF1DE',
  },
  tick: {
    marginRight: 6,
    fontSize: 20,
    fontFamily: fonts.uiBold,
  },
  text: {
    fontSize: fontSizes.wordChip[0],
    fontFamily: fonts.body,
    color: colors.ink,
  },
  foundText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
});
