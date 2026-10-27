import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { ScreenProps } from '../app/navigation';
import { meaningOf } from '../game/levels/levelRepo';
import { getDailyQuiz, QUIZ_LENGTH, QuizQuestion } from '../game/quiz/dailyQuiz';
import { answerCoins, nextStreakGift, perfectCoins } from '../game/quiz/quizRewards';
import { landmarkKey } from '../map/landmarkPlan';
import { AudioManager } from '../services/audio/AudioManager';
import { HapticsManager } from '../services/haptics/HapticsManager';
import { getTodayKey } from '../store/daily';
import { streakStatus, useQuiz } from '../store/quiz';
import { useSettings } from '../store/settings';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts, sizes } from '../ui/theme';
import { TKey, Translate, useT, worldKey } from '../i18n';
import { ChoiceCard, JumbleCard } from './quiz/QuizCards';
import { QuizSummary } from './quiz/QuizSummary';

const TYPES: { icon: string; key: TKey }[] = [
  { icon: '📖', key: 'quiz.type.meaning' },
  { icon: '🔤', key: 'quiz.type.missing' },
  { icon: '🏛️', key: 'quiz.type.landmark' },
  { icon: '🧭', key: 'quiz.type.where' },
  { icon: '🔀', key: 'quiz.type.jumble' },
];

const DAY_LABEL: Record<string, TKey> = { easy: 'quiz.easy', medium: 'quiz.medium', hard: 'quiz.hard' };

type Reveal = { picked: number | null; guess: string | null; correct: boolean; coins: number; combo: number };

// Best a player can earn from the answers alone: every answer right, combo from the 3rd
function maxCoins(bigDay: boolean): number {
  let total = perfectCoins(bigDay);
  for (let combo = 1; combo <= QUIZ_LENGTH; combo++) total += answerCoins(true, combo, bigDay);
  return total;
}

// "Did you know" line after an answer: the word's meaning, or where the sight stands
function learnText(t: Translate, q: QuizQuestion): string {
  const place = t(worldKey(q.world));
  if (q.kind === 'landmark') return t('quiz.learnLandmark', { name: t(landmarkKey(q.word)), world: place });
  const meaning = `${q.word}: ${meaningOf(q.word) ?? ''}`;
  return q.kind === 'where' ? `${meaning}\n${t('quiz.learnWhere', { world: place })}` : meaning;
}

// The letters may spell another real word; that counts too
function jumbleRight(word: string, guess: string): boolean {
  if (guess === word) return true;
  return [...guess].sort().join('') === [...word].sort().join('') && Boolean(meaningOf(guess));
}

export function QuizScreen({ navigation }: ScreenProps<'Quiz'>) {
  const t = useT();
  const reduceMotion = useSettings(s => s.reduceMotion);
  // The quiz started stays the quiz finished, even across midnight
  const [dayKey] = useState(getTodayKey);
  const quiz = useMemo(() => getDailyQuiz(dayKey), [dayKey]);

  const saved = useQuiz(s => s.today);
  const streak = useQuiz(s => s.streak);
  const best = useQuiz(s => s.best);
  const lastDay = useQuiz(s => s.lastDay);
  const saveWeek = useQuiz(s => s.saveWeek);
  const day = saved?.dayKey === dayKey ? saved : null;
  const answered = day?.results.length ?? 0;

  const [started, setStarted] = useState(answered > 0);
  const [index, setIndex] = useState(Math.min(answered, QUIZ_LENGTH - 1));
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const enter = <T,>(anim: T) => (reduceMotion ? undefined : anim);

  // Closed the app right after the last answer: finish it on opening (not while its answer card shows)
  useEffect(() => {
    if (answered >= QUIZ_LENGTH) useQuiz.getState().finish(dayKey, quiz.bigDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the screen opens
  }, []);

  const question = quiz.questions[index];
  const status = streakStatus(streak, lastDay, saveWeek, dayKey);

  const record = (correct: boolean, picked: number | null, guess: string | null) => {
    const result = useQuiz.getState().answer(dayKey, index, correct, quiz.bigDay);
    if (!result) return;
    if (correct) {
      AudioManager.playWordFound();
      HapticsManager.wordFound();
    } else {
      AudioManager.playWrongSelection();
      HapticsManager.errorThud();
      if (!reduceMotion) {
        shake.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
      }
    }
    setReveal({ picked, guess, correct, ...result });
  };

  const next = () => {
    setReveal(null);
    setHidden([]);
    if (index + 1 >= QUIZ_LENGTH) {
      useQuiz.getState().finish(dayKey, quiz.bigDay);
      AudioManager.playLevelComplete();
      HapticsManager.levelComplete();
      return;
    }
    setIndex(index + 1);
  };

  // 50/50: hides two wrong answers, once a day
  const applyFifty = () => {
    if (question.kind === 'jumble' || day?.used5050 || reveal) return;
    const wrong = question.options.map((_, i) => i).filter(i => i !== question.answer);
    setHidden(wrong.sort(() => 0.5 - Math.random()).slice(0, 2));
    useQuiz.getState().use5050(dayKey);
  };

  if (day?.finished) {
    return (
      <Screen title={t('quiz.title')} onBack={() => navigation.goBack()}>
        <QuizSummary
          day={day}
          quizNumber={quiz.number}
          streak={streak}
          best={best}
          reduceMotion={reduceMotion}
          onOpenChest={() => useQuiz.getState().openChest(dayKey)}
          onDone={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen title={t('quiz.title')} onBack={() => navigation.goBack()}>
        <ScrollView style={styles.fill} contentContainerStyle={styles.intro} showsVerticalScrollIndicator={false}>
          <Text style={styles.bigIcon}>🧠</Text>
          <Text style={styles.quizNo}>{t('quiz.number', { n: quiz.number })}</Text>
          <View style={[styles.dayChip, quiz.bigDay && styles.dayChipBig]}>
            <Text style={[styles.dayChipText, quiz.bigDay && styles.dayChipTextBig]}>
              {quiz.bigDay ? t('quiz.bigDay') : t(DAY_LABEL[quiz.difficulty])}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.streak}>
              🔥 {status.shown > 0 ? t('quiz.streak', { n: status.shown }) : t('quiz.streakNone')}
            </Text>
            <Text style={styles.note}>
              {status.atRisk ? t('quiz.atRisk') : t('quiz.nextGift', { n: nextStreakGift(status.shown) })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('quiz.inside')}</Text>
            {TYPES.map(type => (
              <Text key={type.key} style={styles.typeLine}>
                {type.icon}  {t(type.key)}
              </Text>
            ))}
          </View>

          <Text style={styles.prize}>🪙 {t('quiz.prize', { n: maxCoins(quiz.bigDay) })} 🎁</Text>
          <PrimaryButton label={t('quiz.start')} variant="coral" onPress={() => setStarted(true)} />
        </ScrollView>
      </Screen>
    );
  }

  const results = day?.results ?? [];
  const fiftyLeft = !day?.used5050 && question.kind !== 'jumble' && !reveal;

  return (
    <Screen title={t('quiz.title')} onBack={() => navigation.goBack()}>
      <View style={styles.fill}>
        <View style={styles.header}>
          <View style={styles.dots} accessible accessibilityLabel={t('quiz.progress', { n: index + 1, total: QUIZ_LENGTH })}>
            {quiz.questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && styles.dotNow,
                  results[i] === true && styles.dotRight,
                  results[i] === false && styles.dotWrong,
                ]}
              />
            ))}
          </View>
          <Text style={styles.earned}>
            {(day?.combo ?? 0) >= 2 ? `🔥${day!.combo}  ` : ''}+{day?.coins ?? 0} 🪙
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.questionBody} showsVerticalScrollIndicator={false}>
          <Animated.View key={index} entering={enter(FadeInDown)} style={shakeStyle}>
            {question.kind === 'jumble' ? (
              <JumbleCard
                q={question}
                checked={reveal?.guess ?? null}
                correct={reveal?.correct ?? false}
                onCheck={guess => record(jumbleRight(question.word, guess), null, guess)}
              />
            ) : (
              <ChoiceCard
                q={question}
                hidden={hidden}
                picked={reveal?.picked ?? null}
                onPick={i => record(i === question.answer, i, null)}
              />
            )}
          </Animated.View>

          {fiftyLeft && (
            <Pressable
              onPress={applyFifty}
              accessibilityRole="button"
              accessibilityLabel={t('quiz.fiftyA11y')}
              style={({ pressed }) => [styles.fifty, pressed && styles.pressed]}
            >
              <Text style={styles.fiftyText}>✂️ {t('quiz.fifty')}</Text>
            </Pressable>
          )}

          {reveal && (
            <Animated.View entering={enter(FadeInDown)} style={styles.feedback}>
              <Text style={[styles.verdict, { color: reveal.correct ? colors.okGreen : colors.accentCoral }]}>
                {reveal.correct ? t('quiz.correct', { n: reveal.coins }) : t('quiz.wrong')}
              </Text>
              {reveal.correct && reveal.combo >= 3 && (
                <Text style={styles.combo}>{t('quiz.combo', { n: reveal.combo })}</Text>
              )}
              <Text style={styles.learn}>💡 {learnText(t, question)}</Text>
              <PrimaryButton
                label={t(index + 1 >= QUIZ_LENGTH ? 'quiz.seeResults' : 'quiz.next')}
                variant="coral"
                onPress={next}
              />
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: 'stretch',
  },
  intro: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 14,
  },
  bigIcon: {
    fontSize: 64,
  },
  quizNo: {
    fontSize: 28,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(14,110,140,0.1)',
  },
  dayChipBig: {
    backgroundColor: colors.coinGold,
  },
  dayChipText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  dayChipTextBig: {
    color: colors.ink,
  },
  card: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: sizes.radius,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(31,42,55,0.12)',
    gap: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 4,
  },
  typeLine: {
    fontSize: 18,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  streak: {
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.accentCoral,
    textAlign: 'center',
  },
  note: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
  prize: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: '#B07F00',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8DFD0',
  },
  dotNow: {
    borderWidth: 3,
    borderColor: colors.primaryOcean,
    backgroundColor: colors.white,
  },
  dotRight: {
    borderWidth: 0,
    backgroundColor: colors.okGreen,
  },
  dotWrong: {
    borderWidth: 0,
    backgroundColor: colors.accentCoral,
  },
  earned: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: '#B07F00',
  },
  questionBody: {
    paddingTop: 12,
    paddingBottom: 32,
  },
  fifty: {
    alignSelf: 'center',
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    backgroundColor: '#FFF1C9',
    borderWidth: 2,
    borderColor: colors.coinGold,
  },
  fiftyText: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  feedback: {
    marginTop: 20,
    padding: 16,
    borderRadius: sizes.radius,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(31,42,55,0.12)',
    alignItems: 'center',
    gap: 10,
  },
  verdict: {
    fontSize: 26,
    fontFamily: fonts.uiBold,
  },
  combo: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.accentCoral,
  },
  learn: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.body,
    color: colors.ink,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
