import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { AppState, BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { levelTag, newDirectionsAt } from '../game/levels/levelSpec';
import { TAG_BONUS_COINS } from '../game/engine/rewards';
import { AnalyticsManager } from '../services/analytics/AnalyticsManager';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { useDaily } from '../store/daily';
import { usePlayStats } from '../store/playStats';
import { GridCanvas, HintOverlay } from '../game/render/GridCanvas';
import { maxZoomFor, MIN_CELL } from '../game/render/zoom';
import { Cell, Dir, wordCells } from '../game/types';
import { useProgress } from '../store/progress';
import { useSettings } from '../store/settings';
import { useWallet } from '../store/wallet';
import { CoinPill } from '../ui/CoinPill';
import { BulbIcon, PauseIcon } from '../ui/GameIcons';
import { HintSheet } from '../ui/HintSheet';
import { IconButton } from '../ui/IconButton';
import { MeaningCard } from '../ui/MeaningCard';
import { PauseSheet } from '../ui/PauseSheet';
import { PostcardFrame } from '../ui/PostcardFrame';
import { PostmarkStamp } from '../ui/PostmarkStamp';
import { ProgressBar } from '../ui/ProgressBar';
import { Screen } from '../ui/Screen';
import { Toast } from '../ui/Toast';
import { TutorialHand } from '../ui/TutorialHand';
import { WordChip } from '../ui/WordChip';
import { TAG_COLOR, TAG_LABEL } from '../ui/levelTag';
import { colors, fonts, fontSizes, sizes } from '../ui/theme';
import { FOUND_MARKS, MAX_CELL, useTextSize } from '../ui/a11y';
import { useLevelGame } from './level/useLevelGame';
import { useNudgeOffer } from './level/useNudgeOffer';
import { usePlayRecord } from './level/usePlayRecord';
import { WORLD_COUNT } from '../game/levels/worlds';
import { TKey, useT, worldKey } from '../i18n';

const FINISH_DELAY_MS = 900;
const PRAISE: TKey[] = ['level.praise.1', 'level.praise.2', 'level.praise.3', 'level.praise.4', 'level.praise.5'];
// Keyed by the first direction a stage adds (NW comes with SW: all 8 are open then)
const NEW_DIR_TIP: Partial<Record<Dir, TKey>> = {
  W: 'level.newDir.W',
  SE: 'level.newDir.SE',
  N: 'level.newDir.N',
  NE: 'level.newDir.NE',
  NW: 'level.newDir.NW',
};

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
  const cellSize = Math.min(MAX_CELL[textSize], Math.floor((width - sizes.gutter * 2) / level.cols));
  // Too small for the chosen text size: let the player zoom (tablets never need it)
  const maxZoom = maxZoomFor(cellSize, MIN_CELL[textSize]);
  // The postcard says where it comes from; the Daily puzzle and Classic Play have no world
  const worldName = level.world >= 1 && WORLD_COUNT >= level.world ? t(worldKey(level.world)) : null;

  // The first level with a new direction says so, until a word in that direction is found
  const newDirs = useMemo(() => newDirectionsAt(levelId), [levelId]);
  const newDirTip = newDirs.length > 0 ? NEW_DIR_TIP[newDirs[0]] : undefined;
  const newDirLearned = game.foundWords.some(f => newDirs.includes(f.word.dir));

  // Hard levels say so up front (and what the first win pays) until the first word is found
  const tag = levelId === DAILY_LEVEL_ID ? null : levelTag(levelId);
  const [firstWin] = useState(() => !useProgress.getState().stars[levelId]);
  const tagText = tag
    ? firstWin
      ? t('level.tagBonus', { tag: t(TAG_LABEL[tag]), n: TAG_BONUS_COINS[tag] })
      : t(TAG_LABEL[tag])
    : null;

  const [toast, setToast] = useState<{ text: string } | null>(null);
  const [meaningWord, setMeaningWord] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  // Play time counts only while this screen is in front, unpaused, and words are left
  const focused = useIsFocused();
  const playing = focused && !paused && !game.allFound;
  const record = usePlayRecord({
    levelId,
    world: level.world,
    isDaily: game.isDaily,
    resized: game.resized,
    active: playing,
    foundCount: game.found.length,
  });

  // A stuck player is offered one free Spotlight; it costs no coins and no star (engine/nudge.ts)
  const [quits] = useState(() => (game.isDaily ? 0 : (usePlayStats.getState().levels[levelId]?.quits ?? 0)));
  const nudgeOffered = useNudgeOffer({
    elapsedMs: record.elapsedMs,
    active: playing,
    foundCount: game.found.length,
    quits,
    used: game.freeNudgeUsed,
    wordsLeft: level.words.length - game.found.length,
  });
  const takeNudge = () => {
    if (!game.takeFreeNudge()) return;
    AudioManager.playHint();
    HapticsManager.buttonTap();
    AnalyticsManager.logHintUsed('spotlight', 'free');
    setToast({ text: t('level.nudgeTaken') });
  };

  // Flow: a phone call or leaving the app pauses the level
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') setPaused(true);
    });
    return () => sub.remove();
  }, []);

  // Calm music, a little softer than on the map
  useFocusEffect(
    useCallback(() => {
      AudioManager.startMusic('level');
    }, []),
  );

  // Android Back opens the pause menu (or closes it) instead of leaving mid-puzzle
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setPaused(p => !p);
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // Gentle shake on a wrong selection, never a penalty
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleSelect = useCallback(
    (cells: Cell[]) => {
      const result = game.select(cells);
      if (result.kind === 'word') {
        AudioManager.playWordFound();
        HapticsManager.wordFound();
        const dir = level.words.find(pw => pw.w === result.word)?.dir;
        AnalyticsManager.logWordFound(levelId, result.word.length, dir);
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
    [game, showMeanings, reduceMotion, shakeX, t, level.words, levelId],
  );

  const handleHint = (kind: HintKind) => {
    const result = game.buyHint(kind);
    setHintsOpen(false);
    if (result === 'ok') {
      AudioManager.playHint();
      AnalyticsManager.logHintUsed(kind, 'coins');
    }
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

  const { allFound, markCompleted, hints, paidHints, freeNudgeUsed, isDaily, dayKey } = game;
  const { finish } = record;
  useEffect(() => {
    if (!allFound) return;
    const timer = setTimeout(() => {
      markCompleted();
      AudioManager.stopMusic();
      HapticsManager.levelComplete();
      const stars = starsFor(paidHints);
      AnalyticsManager.logLevelComplete(levelId, stars, hints.length, finish(hints.length, firstWin));
      if (isDaily) {
        // Credit the day the puzzle belongs to, even if midnight passed while playing
        const reward = useDaily.getState().completeDaily(dayKey);
        AudioManager.playLevelComplete();
        navigation.replace('Result', {
          levelId,
          stars,
          coins: reward.coins,
          worldCompleted: null,
          freeNudge: freeNudgeUsed,
        });
        return;
      }
      const reward = useProgress.getState().completeLevel(levelId, stars);
      // A finished world gets the grand fanfare, a new landmark its bell tune, any other level the jingle
      if (reward.worldCompleted) AudioManager.playWorldComplete();
      else if (reward.landmarkVisited) AudioManager.playLandmark();
      else AudioManager.playLevelComplete();
      navigation.replace('Result', {
        levelId,
        stars,
        coins: reward.coins,
        worldCompleted: reward.worldCompleted,
        newLandmark: reward.landmarkVisited,
        tagBonus: reward.tagBonus,
        freeNudge: freeNudgeUsed,
      });
    }, FINISH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [allFound, markCompleted, hints.length, paidHints, freeNudgeUsed, levelId, navigation, isDaily, dayKey, finish, firstWin]);

  // Level 1 shows a hand on the first word until the player finds one
  const tutorialWord = levelId === 1 && game.found.length === 0 ? level.words[0] : null;

  const closeMeaning = useCallback(() => setMeaningWord(null), []);
  const meaning = meaningWord ? meaningOf(meaningWord) : undefined;

  return (
    <Screen
      title={levelId === DAILY_LEVEL_ID ? t('level.dailyTitle') : t('common.level', { n: levelId })}
      left={<IconButton icon={<PauseIcon />} label={t('pause.a11y')} onPress={() => setPaused(true)} />}
      right={
        <IconButton
          icon={<BulbIcon />}
          tone="gold"
          label={t('level.hintsA11y', { n: coins })}
          onPress={() => (game.hintTarget ? setHintsOpen(true) : setToast({ text: t('level.allFound') }))}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.progressCol}>
            <Text style={styles.progressText}>
              {game.found.length} / {level.words.length}
            </Text>
            <ProgressBar value={game.found.length / level.words.length} />
          </View>
          <CoinPill coins={coins} />
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
        {newDirTip && !newDirLearned && (
          <View style={styles.tutorialPill}>
            <Text style={styles.tutorialText}>{t(newDirTip)}</Text>
          </View>
        )}
        {tag && tagText && game.found.length === 0 && (
          <View style={[styles.tagPill, { backgroundColor: TAG_COLOR[tag] }]}>
            <Text style={styles.tagText}>🔥 {tagText}</Text>
          </View>
        )}

        <Animated.View style={shakeStyle}>
          {/* High contrast keeps the board flat, every letter exactly upright */}
          <PostcardFrame style={!highContrast && styles.tilt} paperStyle={styles.postcardPaper}>
            <View style={styles.postcardHeader}>
              <View style={styles.postcardTitles}>
                {worldName && (
                  <Text style={styles.postcardWorld} numberOfLines={1}>
                    {worldName}
                  </Text>
                )}
                <Text style={styles.postcardTheme} numberOfLines={1}>
                  {level.theme}
                </Text>
              </View>
              <View style={styles.stampSlot}>
                <PostmarkStamp world={level.world} count={game.found.length} reduceMotion={reduceMotion} />
              </View>
            </View>
            {/* the tutorial hand is placed in grid coordinates, so it shares this box with the grid */}
            <View>
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
                maxZoom={maxZoom}
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
            </View>
          </PostcardFrame>
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
                onPress={f && meaningOf(pw.w) ? setMeaningWord : undefined}
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
      {/* at the top, so praise never covers the meaning card or word list at the bottom */}
      <Toast toast={toast} placement="top" />
      {/* Floats over the free space under the word list, so the grid never moves under the finger */}
      {nudgeOffered && !meaningWord && (
        <Pressable
          style={styles.nudge}
          onPress={takeNudge}
          accessibilityRole="button"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.nudgeText}>💡 {t('level.nudge')}</Text>
        </Pressable>
      )}
      <PauseSheet
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={() => {
          game.restart();
          record.restart();
          setMeaningWord(null);
          setPaused(false);
          setToast({ text: t('pause.restarted') });
        }}
        onSettings={() => {
          setPaused(false);
          navigation.navigate('Settings');
        }}
        onMap={() => {
          setPaused(false);
          // popTo also works for a first-run player who came straight from onboarding
          navigation.popTo('Map');
        }}
      />
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
    marginBottom: 14,
  },
  progressCol: {
    flex: 1,
    marginRight: 12,
  },
  progressText: {
    marginBottom: 6,
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: '#4A5563',
  },
  // A postcard lying on the table, leaning away a little. The grid inside keeps its full width:
  // the frame reaches into the screen gutter, so cell sizes (and zoom) are unchanged.
  tilt: {
    transform: [{ perspective: 1200 }, { rotateX: '7deg' }, { rotateZ: '-0.6deg' }],
  },
  postcardPaper: {
    paddingHorizontal: 3,
    paddingTop: 2,
    paddingBottom: 3,
  },
  postcardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingLeft: 8,
  },
  postcardTitles: {
    flex: 1,
  },
  postcardWorld: {
    fontSize: 12,
    fontFamily: fonts.uiBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primaryOcean,
  },
  postcardTheme: {
    fontSize: fontSizes.ui[1],
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  // The postmark leans over the top edge so the header stays short
  stampSlot: {
    width: 62,
    height: 46,
    alignItems: 'center',
    marginTop: -16,
  },
  chipScroll: {
    alignSelf: 'stretch',
    marginTop: 14,
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
  nudge: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    // The same gold as the hint (bulb) button: this is a hint, just a free one
    backgroundColor: '#FFF4CC',
    borderWidth: 2,
    borderColor: '#E0A400',
    elevation: 6,
  },
  nudgeText: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  tagPill: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.white,
    textAlign: 'center',
  },
});
