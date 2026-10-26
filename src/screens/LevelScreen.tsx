import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { ScreenProps } from '../app/navigation';
import { HintKind, strongestMark } from '../game/engine/hints';
import { starsFor } from '../game/engine/scoring';
import { DAILY_LEVEL_ID, meaningOf } from '../game/levels/levelRepo';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { useDaily } from '../store/daily';
import { GridCanvas, HintOverlay } from '../game/render/GridCanvas';
import { Cell, wordCells } from '../game/types';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { CoinPill } from '../ui/CoinPill';
import { HintSheet } from '../ui/HintSheet';
import { IconButton } from '../ui/IconButton';
import { MeaningCard } from '../ui/MeaningCard';
import { ProgressBar } from '../ui/ProgressBar';
import { Screen } from '../ui/Screen';
import { Toast } from '../ui/Toast';
import { TutorialHand } from '../ui/TutorialHand';
import { WordChip } from '../ui/WordChip';
import { colors, fonts, fontSizes, sizes } from '../ui/theme';
import { FOUND_MARKS, MAX_CELL, useTextSize } from '../ui/a11y';
import { useLevelGame } from './level/useLevelGame';
import { TKey, useT } from '../i18n';

const FINISH_DELAY_MS = 900;
const PRAISE: TKey[] = ['level.praise.1', 'level.praise.2', 'level.praise.3', 'level.praise.4', 'level.praise.5'];

export function LevelScreen({ navigation, route }: ScreenProps<'Level'>) {
  const { levelId } = route.params;
  const t = useT();
  const textSize = useTextSize();
  const highContrast = useSettings(s => s.highContrast);
  const colorBlind = useSettings(s => s.colorBlind);
  const game = useLevelGame(levelId, textSize);
  const { level } = game;
  const coins = useWallet(s => s.coins);
  const inputMode = useSettings(s => s.inputMode);
  const showMeanings = useSettings(s => s.meanings);
  const reduceMotion = useSettings(s => s.reduceMotion);

  const { width } = useWindowDimensions();
  // Big grids shrink to fit for now; pinch-zoom for small phones comes later
  const cellSize = Math.min(MAX_CELL[textSize], Math.floor((width - sizes.gutter * 2) / level.cols));

  const [toast, setToast] = useState<{ text: string } | null>(null);
  const [meaningWord, setMeaningWord] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);

  // Gentle shake on a wrong selection, never a penalty
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleSelect = useCallback(
    (cells: Cell[]) => {
      const result = game.select(cells);
      if (result.kind === 'word') {
        AudioManager.playWordFound();
        HapticsManager.wordFound();
        setToast({ text: t(PRAISE[game.found.length % PRAISE.length]) });
        if (showMeanings && meaningOf(result.word)) setMeaningWord(result.word);
      } else if (result.kind === 'bonus') {
        AudioManager.playCoinGain();
        HapticsManager.wordFound();
        setToast({ text: t('level.bonus', { word: result.word }) });
      } else if (result.kind === 'miss') {
        AudioManager.playWrongSelection();
        HapticsManager.errorThud();
        if (!reduceMotion) {
          shakeX.value = withSequence(
            withTiming(-6, { duration: 50 }),
            withRepeat(withTiming(6, { duration: 80 }), 3, true),
            withTiming(0, { duration: 50 }),
          );
        }
      }
    },
    [game, showMeanings, reduceMotion, shakeX, t],
  );

  const handleHint = (kind: HintKind) => {
    const result = game.buyHint(kind);
    setHintsOpen(false);
    if (result === 'no-coins') setToast({ text: t('level.noCoins') });
    if (result === 'none-left') setToast({ text: t('level.allFound') });
  };

  // Show the latest spotlight/compass hint until that word is found
  const hintOverlay: HintOverlay | null = useMemo(() => {
    const open = [...game.hints]
      .reverse()
      .find(m => m.kind !== 'reveal' && !game.found.includes(m.word));
    const word = open && level.words.find(pw => pw.w === open.word);
    if (!word) return null;
    return { word, withDirection: strongestMark(game.hints, word.w) === 'compass' };
  }, [game.hints, game.found, level.words]);

  const { allFound, markCompleted, hints, isDaily, dayKey } = game;
  useEffect(() => {
    if (!allFound) return;
    const timer = setTimeout(() => {
      markCompleted();
      AudioManager.playLevelComplete();
      HapticsManager.levelComplete();
      const stars = starsFor(hints.length);
      if (isDaily) {
        // Credit the day the puzzle belongs to, even if midnight passed while playing
        const reward = useDaily.getState().completeDaily(dayKey);
        navigation.replace('Result', { levelId, stars, coins: reward.coins, worldCompleted: null });
        return;
      }
      const reward = useProgress.getState().completeLevel(levelId, stars);
      navigation.replace('Result', {
        levelId,
        stars,
        coins: reward.coins,
        worldCompleted: reward.worldCompleted,
      });
    }, FINISH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [allFound, markCompleted, hints.length, levelId, navigation, isDaily, dayKey]);

  // Level 1 shows a hand on the first word until the player finds one
  const tutorialWord = levelId === 1 && game.found.length === 0 ? level.words[0] : null;

  const closeMeaning = useCallback(() => setMeaningWord(null), []);
  const meaning = meaningWord ? meaningOf(meaningWord) : undefined;

  return (
    <Screen
      title={levelId === DAILY_LEVEL_ID ? t('level.dailyTitle') : t('common.level', { n: levelId })}
      // A first-run player arrives here straight from onboarding, with nothing to go back to
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Map'))}
      right={
        <IconButton
          icon="💡"
          label={t('level.hintsA11y', { n: coins })}
          onPress={() => (game.hintTarget ? setHintsOpen(true) : setToast({ text: t('level.allFound') }))}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.theme}>{level.theme}</Text>
          <CoinPill coins={coins} />
        </View>
        <View style={styles.progress}>
          <ProgressBar value={game.found.length / level.words.length} />
        </View>

        {levelId === 1 && game.found.length === 0 && (
          <View style={styles.tutorialPill}>
            <Text style={styles.tutorialText}>
              {inputMode === 'tap'
                ? t('level.tutorial.tap')
                : t('level.tutorial.drag')}
            </Text>
          </View>
        )}

        <Animated.View style={shakeStyle}>
          <GridCanvas
            grid={level.grid}
            cellSize={cellSize}
            found={game.foundWords}
            hint={hintOverlay}
            inputMode={inputMode}
            reduceMotion={reduceMotion}
            textSize={textSize}
            highContrast={highContrast}
            colorBlind={colorBlind}
            onSelect={handleSelect}
          />
          {tutorialWord && (
            <TutorialHand
              from={tutorialWord.start}
              to={wordCells(tutorialWord).slice(-1)[0]}
              cellSize={cellSize}
              inputMode={inputMode}
              reduceMotion={reduceMotion}
            />
          )}
        </Animated.View>

        <ScrollView style={styles.chipScroll} contentContainerStyle={styles.chips}>
          {level.words.map(pw => {
            const foundIndex = game.found.indexOf(pw.w);
            const f = foundIndex >= 0 ? game.foundWords[foundIndex] : undefined;
            return (
              <WordChip
                key={pw.w}
                word={pw.w}
                found={Boolean(f)}
                color={f?.color}
                textSize={textSize}
                highContrast={highContrast}
                mark={colorBlind && f ? FOUND_MARKS[foundIndex % FOUND_MARKS.length] : undefined}
                onPress={f && meaningOf(pw.w) ? () => setMeaningWord(pw.w) : undefined}
              />
            );
          })}
          {game.bonusFound.length > 0 && (
            <Text style={styles.bonus}>{t('level.bonusList', { words: game.bonusFound.join(', ') })}</Text>
          )}
        </ScrollView>
      </View>

      {meaningWord && meaning && (
        <MeaningCard word={meaningWord} meaning={meaning} onClose={closeMeaning} />
      )}
      <Toast toast={toast} />
      <HintSheet
        visible={hintsOpen}
        coins={coins}
        onPick={handleHint}
        onClose={() => setHintsOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  theme: {
    flex: 1,
    fontSize: fontSizes.ui[1],
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  progress: {
    alignSelf: 'stretch',
    marginVertical: 12,
  },
  chipScroll: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 140, // room for the meaning card
  },
  bonus: {
    width: '100%',
    marginTop: 8,
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  tutorialPill: {
    backgroundColor: '#FFF0D9',
    borderWidth: 1.5,
    borderColor: colors.accentCoral,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  tutorialText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
});
