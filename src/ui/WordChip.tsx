import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  // found chips open the meaning card again; gets the word so the screen can pass one stable callback
  onPress?: (word: string) => void;
};

// A light wash of the capsule colour, mixed into the paper rather than see-through,
// so the table behind the tag does not muddy it
function wash(hex: string): string {
  const mix = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.22 + parseInt(colors.paper.slice(i, i + 2), 16) * 0.78);
  return `rgb(${mix(1)}, ${mix(3)}, ${mix(5)})`;
}

// memo: a toast or coin change on the level screen should not redraw every chip
export const WordChip = memo(function WordChipView({
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
      onPress={onPress && withTap(() => onPress(word))}
      disabled={!onPress}
      style={[
        styles.chip,
        { minHeight: Math.max(44, fontSize + 22) },
        highContrast && styles.chipContrast,
        found && {
          borderColor: highContrast ? colors.ink : color,
          // high contrast stays plain white
          backgroundColor: highContrast ? colors.white : wash(color),
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={found ? t('chip.found', { word }) : word}
    >
      <View style={[styles.hole, highContrast && styles.holeContrast]} />
      {found && <Text style={[styles.tick, { fontSize }]}>{mark ?? '✓'}</Text>}
      <Text style={[styles.text, { fontSize }, highContrast && styles.textContrast, found && styles.foundText]}>
        {word}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chipContrast: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  textContrast: {
    color: '#000000',
  },
  // A luggage tag: square end with a string hole on the left, round end on the right
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingLeft: 28,
    paddingRight: 14,
    margin: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 2,
    borderColor: colors.tagBorder,
    backgroundColor: colors.paper,
    elevation: 2,
    shadowColor: '#503214',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  hole: {
    position: 'absolute',
    left: 9,
    top: '50%',
    width: 10,
    height: 10,
    marginTop: -5,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#B9A57F',
    backgroundColor: colors.bgTable,
  },
  holeContrast: {
    borderColor: colors.ink,
  },
  tick: {
    marginRight: 6,
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.ink,
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
