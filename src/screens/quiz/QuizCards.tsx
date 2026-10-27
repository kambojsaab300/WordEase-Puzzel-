import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ChoiceQuestion, JumbleQuestion } from '../../game/quiz/dailyQuiz';
import { WORLDS } from '../../game/levels/worlds';
import { LANDMARK_ART, landmarkKey } from '../../map/landmarkPlan';
import { useTextSize } from '../../ui/a11y';
import { LandmarkArt } from '../../ui/LandmarkArt';
import { colors, fonts, fontSizes, sizes } from '../../ui/theme';
import { Translate, useT, worldKey } from '../../i18n';

const GAP_COLOR = '#FFE7B3';
const FADED = 0.45;

/** Text a player sees for an option (words and letters as they are; sights and worlds translated) */
export function optionLabel(t: Translate, q: ChoiceQuestion, option: string): string {
  if (q.kind === 'landmark') return t(landmarkKey(option));
  if (q.kind === 'where') return t(worldKey(Number(option)));
  return option;
}

function Prompt({ q }: { q: ChoiceQuestion }) {
  const t = useT();
  const size = fontSizes.ui[useTextSize()];
  const world = WORLDS[q.world - 1];

  switch (q.kind) {
    case 'meaning':
      return (
        <>
          <Text style={[styles.ask, { fontSize: size }]}>{t('quiz.q.meaning')}</Text>
          <View style={styles.clue}>
            <Text style={[styles.clueText, { fontSize: size + 2, lineHeight: (size + 2) * 1.35 }]}>“{q.prompt}”</Text>
          </View>
        </>
      );
    case 'missing':
      return (
        <>
          <Text style={[styles.ask, { fontSize: size }]}>{t('quiz.q.missing')}</Text>
          <View style={styles.letters} accessible accessibilityLabel={q.prompt.replace(/_/g, ' blank ')}>
            {[...q.prompt].map((ch, i) => (
              <View key={i} style={[styles.letterBox, ch === '_' && styles.letterGap]}>
                <Text style={styles.letter}>{ch === '_' ? '?' : ch}</Text>
              </View>
            ))}
          </View>
        </>
      );
    case 'landmark':
      return (
        <>
          <Text style={[styles.ask, { fontSize: size }]}>{t('quiz.q.landmark')}</Text>
          <View style={[styles.art, { backgroundColor: world.palette.sky }]} importantForAccessibility="no-hide-descendants">
            <LandmarkArt path={LANDMARK_ART[q.word]} color={world.palette.near} size={150} />
          </View>
        </>
      );
    case 'where':
      return (
        <>
          <Text style={[styles.ask, { fontSize: size }]}>{t('quiz.q.where', { word: q.word })}</Text>
          <Text style={styles.bigWord}>{q.word}</Text>
        </>
      );
  }
}

type ChoiceProps = {
  q: ChoiceQuestion;
  hidden: number[];
  picked: number | null;
  onPick: (index: number) => void;
};

export function ChoiceCard({ q, hidden, picked, onPick }: ChoiceProps) {
  const t = useT();
  const size = fontSizes.ui[useTextSize()];
  const revealed = picked !== null;

  return (
    <View>
      <Prompt q={q} />
      <View style={styles.options}>
        {q.options.map((option, i) => {
          if (hidden.includes(i)) return <View key={i} style={[styles.option, styles.optionGone]} />;
          const right = revealed && i === q.answer;
          const wrong = revealed && i === picked && i !== q.answer;
          return (
            <Pressable
              key={i}
              disabled={revealed}
              onPress={() => onPick(i)}
              accessibilityRole="button"
              accessibilityState={{ disabled: revealed, selected: i === picked }}
              accessibilityLabel={optionLabel(t, q, option)}
              style={({ pressed }) => [
                styles.option,
                right && styles.optionRight,
                wrong && styles.optionWrong,
                revealed && !right && !wrong && { opacity: FADED },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.optionText, { fontSize: size }, (right || wrong) && styles.optionTextOn]}>
                {right ? '✓ ' : wrong ? '✗ ' : ''}
                {optionLabel(t, q, option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type JumbleProps = {
  q: JumbleQuestion;
  /** The player's word once checked; null while still building it */
  checked: string | null;
  /** Any real word from these letters counts, not only the planned one */
  correct: boolean;
  onCheck: (guess: string) => void;
};

export function JumbleCard({ q, checked, correct, onCheck }: JumbleProps) {
  const t = useT();
  const { width } = useWindowDimensions();
  const [placed, setPlaced] = useState<number[]>([]);
  const tile = Math.min(54, Math.floor((width - sizes.gutter * 2 - 8 * q.tiles.length) / q.tiles.length));
  const tileText = { fontSize: Math.round(tile * 0.55) };
  const full = placed.length === q.tiles.length;
  const guess = placed.map(i => q.tiles[i]).join('');
  const done = checked !== null;
  const right = done && correct;

  return (
    <View>
      <Text style={[styles.ask, { fontSize: fontSizes.ui[1] }]}>{t('quiz.q.jumble')}</Text>

      <View style={styles.letters}>
        {q.tiles.map((_, slot) => {
          const letter = done ? checked[slot] : placed[slot] !== undefined ? q.tiles[placed[slot]] : '';
          return (
            <Pressable
              key={slot}
              disabled={done || placed[slot] === undefined}
              onPress={() => setPlaced(p => p.filter((__, k) => k !== slot))}
              accessibilityRole="button"
              accessibilityLabel={t('quiz.slotA11y', { n: slot + 1, letter: letter || '-' })}
              style={[
                styles.slot,
                { width: tile, height: tile },
                done && (right ? styles.optionRight : styles.optionWrong),
              ]}
            >
              <Text style={[styles.letter, tileText, done && styles.optionTextOn]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>

      {done && !right && (
        <Text style={styles.answerWas}>{t('quiz.answerWas', { answer: q.word })}</Text>
      )}

      {!done && (
        <>
          <View style={[styles.letters, styles.tiles]}>
            {q.tiles.map((ch, i) => {
              const used = placed.includes(i);
              return (
                <Pressable
                  key={i}
                  disabled={used}
                  onPress={() => setPlaced(p => [...p, i])}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: used }}
                  accessibilityLabel={t('quiz.tileA11y', { letter: ch })}
                  style={({ pressed }) => [
                    styles.tile,
                    { width: tile, height: tile },
                    used && styles.tileUsed,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.letter, tileText, styles.tileLetter]}>{used ? '' : ch}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.jumbleActions}>
            <Pressable
              onPress={() => setPlaced([])}
              disabled={placed.length === 0}
              accessibilityRole="button"
              accessibilityLabel={t('quiz.clear')}
              accessibilityState={{ disabled: placed.length === 0 }}
              style={({ pressed }) => [styles.smallButton, placed.length === 0 && { opacity: FADED }, pressed && styles.pressed]}
            >
              <Text style={styles.smallButtonText}>{t('quiz.clear')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onCheck(guess)}
              disabled={!full}
              accessibilityRole="button"
              accessibilityLabel={t('quiz.check')}
              accessibilityState={{ disabled: !full }}
              style={({ pressed }) => [
                styles.smallButton,
                styles.checkButton,
                !full && { opacity: FADED },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.smallButtonText, styles.optionTextOn]}>{t('quiz.check')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ask: {
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  clue: {
    padding: 16,
    borderRadius: sizes.radius,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
    borderStyle: 'dashed',
  },
  clueText: {
    fontFamily: fonts.body,
    color: colors.ink,
    textAlign: 'center',
  },
  letters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterBox: {
    width: 46,
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(31,42,55,0.15)',
  },
  letterGap: {
    backgroundColor: GAP_COLOR,
    borderColor: colors.coinGold,
    borderStyle: 'dashed',
  },
  letter: {
    fontSize: 28,
    fontFamily: fonts.grid,
    color: colors.ink,
  },
  art: {
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigWord: {
    fontSize: 36,
    fontFamily: fonts.grid,
    color: colors.primaryOcean,
    textAlign: 'center',
    letterSpacing: 2,
  },
  options: {
    marginTop: 20,
    gap: 10,
  },
  option: {
    minHeight: sizes.touchTarget + 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: sizes.radius,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
  },
  optionGone: {
    opacity: 0.2,
    borderStyle: 'dashed',
  },
  optionRight: {
    backgroundColor: colors.okGreen,
    borderColor: colors.okGreen,
  },
  optionWrong: {
    backgroundColor: colors.accentCoral,
    borderColor: colors.accentCoral,
  },
  optionText: {
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  optionTextOn: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  slot: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
    borderStyle: 'dashed',
  },
  tiles: {
    marginTop: 24,
  },
  tile: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryOcean,
  },
  tileUsed: {
    backgroundColor: 'rgba(14,110,140,0.15)',
  },
  tileLetter: {
    color: colors.white,
  },
  answerWas: {
    marginTop: 12,
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.okGreen,
    textAlign: 'center',
  },
  jumbleActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  smallButton: {
    minHeight: sizes.touchTarget,
    minWidth: 120,
    paddingHorizontal: 20,
    borderRadius: sizes.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
  },
  checkButton: {
    backgroundColor: colors.accentCoral,
    borderColor: colors.accentCoral,
  },
  smallButtonText: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
});
