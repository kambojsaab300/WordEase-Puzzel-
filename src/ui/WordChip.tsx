import { Pressable, StyleSheet, Text } from 'react-native';
import { TextSizeIndex } from './a11y';
import { colors, fonts, fontSizes } from './theme';
import { useT } from '../i18n';
import { withTap } from './withTap';

type Props = {
  word: string;
  found: boolean;
  color?: string; // capsule colour of the found word
  textSize?: TextSizeIndex;
  highContrast?: boolean;
  mark?: string; // colour-blind mode: symbol matching the word's pattern on the grid
  onPress?: () => void; // found chips open the meaning card again
};

export function WordChip({
  word,
  found,
  color = colors.okGreen,
  textSize = 0,
  highContrast = false,
  mark,
  onPress,
}: Props) {
  const t = useT();
  const fontSize = fontSizes.wordChip[textSize];
  return (
    <Pressable
      onPress={onPress && withTap(onPress)}
      disabled={!onPress}
      style={[
        styles.chip,
        { minHeight: Math.max(44, fontSize + 22) },
        highContrast && styles.chipContrast,
        found && { borderColor: highContrast ? colors.ink : color, backgroundColor: colors.white },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={found ? t('chip.found', { word }) : word}
    >
      {found && <Text style={[styles.tick, { color, fontSize }]}>{mark ?? '✓'}</Text>}
      <Text style={[styles.text, { fontSize }, highContrast && styles.textContrast, found && styles.foundText]}>
        {word}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipContrast: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  textContrast: {
    color: '#000000',
  },
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
