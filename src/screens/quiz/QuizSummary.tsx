import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { QUIZ_LENGTH } from '../../game/quiz/dailyQuiz';
import { nextStreakGift } from '../../game/quiz/quizRewards';
import { AudioManager } from '../../services/audio/AudioManager';
import { HapticsManager } from '../../services/haptics/HapticsManager';
import type { QuizDay } from '../../store/quiz';
import { Confetti } from '../../ui/Confetti';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { colors, fonts, sizes } from '../../ui/theme';
import { TKey, useT } from '../../i18n';
import { withTap } from '../../ui/withTap';

const PARTY = [colors.coinGold, colors.accentCoral, colors.okGreen, '#56B4E9'];

export const resultRow = (results: boolean[]) => results.map(ok => (ok ? '🟩' : '🟥')).join('');

function headlineKey(score: number): TKey {
  if (score === QUIZ_LENGTH) return 'quiz.score.5';
  if (score === QUIZ_LENGTH - 1) return 'quiz.score.4';
  if (score === QUIZ_LENGTH - 2) return 'quiz.score.3';
  return 'quiz.score.low';
}

// Time left until the phone's next midnight, as h:mm:ss
function useTimeToMidnight(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(left / 3600)}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`;
}

// Ticks on its own, so the rest of the summary is not re-rendered every second
function Countdown() {
  const t = useT();
  const countdown = useTimeToMidnight();
  return <Text style={styles.countdown}>{t('quiz.nextIn', { time: countdown })}</Text>;
}

function Chest({ reduceMotion, onOpen }: { reduceMotion: boolean; onOpen: () => void }) {
  const t = useT();
  const wobble = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    wobble.value = withRepeat(
      withSequence(withTiming(-6, { duration: 120 }), withTiming(6, { duration: 120 }), withTiming(0, { duration: 120 }), withTiming(0, { duration: 900 })),
      -1,
    );
  }, [wobble, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${t('quiz.chest')}. ${t('quiz.chestTap')}`}
      style={({ pressed }) => [styles.chest, pressed && styles.pressed]}
    >
      <Animated.Text style={[styles.chestIcon, style]}>🎁</Animated.Text>
      <Text style={styles.chestTitle}>{t('quiz.chest')}</Text>
      <Text style={styles.chestTap}>{t('quiz.chestTap')}</Text>
    </Pressable>
  );
}

type Props = {
  day: QuizDay;
  quizNumber: number;
  streak: number;
  best: number;
  reduceMotion: boolean;
  onOpenChest: () => void;
  onDone: () => void;
};

export function QuizSummary({ day, quizNumber, streak, best, reduceMotion, onOpenChest, onDone }: Props) {
  const t = useT();
  const score = day.results.filter(Boolean).length;
  const answerCoins = day.coins - day.perfectBonus - day.streakGift - (day.chestOpened ? day.chest : 0);
  const [burst, setBurst] = useState(0);

  const openChest = () => {
    AudioManager.playChest();
    HapticsManager.levelComplete();
    onOpenChest();
    setBurst(b => b + 1);
  };

  const share = () => {
    Share.share({
      message: t('quiz.shareText', {
        n: quizNumber,
        score,
        total: QUIZ_LENGTH,
        row: resultRow(day.results),
        streak,
      }),
    }).catch(() => undefined);
  };

  const enter = <T,>(anim: T) => (reduceMotion ? undefined : anim);

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={enter(ZoomIn)} style={styles.headline}>
          {t(headlineKey(score))}
        </Animated.Text>
        <Text style={styles.score}>{t('quiz.scoreLine', { n: score, total: QUIZ_LENGTH })}</Text>
        <Text style={styles.row} accessibilityElementsHidden>
          {resultRow(day.results)}
        </Text>

        <View style={styles.card}>
          <Line label={t('quiz.earnedAnswers')} coins={answerCoins} />
          {day.perfectBonus > 0 && <Line label={t('quiz.earnedPerfect')} coins={day.perfectBonus} />}
          {day.streakGift > 0 && <Line label={t('quiz.earnedStreak')} coins={day.streakGift} />}
          {day.chestOpened && <Line label={t('quiz.chest')} coins={day.chest} />}
        </View>

        {day.chestOpened ? (
          <Animated.View entering={enter(ZoomIn)} style={[styles.chest, styles.chestOpen]}>
            <Text style={styles.chestIcon}>🪙</Text>
            <Text style={styles.chestGot}>{t('quiz.chestGot', { n: day.chest })}</Text>
          </Animated.View>
        ) : (
          <Chest reduceMotion={reduceMotion} onOpen={openChest} />
        )}

        <View style={styles.card}>
          <Text style={styles.streak}>🔥 {t('quiz.streak', { n: streak })}</Text>
          {day.streakSaved && <Text style={styles.note}>{t('quiz.saved')}</Text>}
          <Text style={styles.note}>
            {t('quiz.nextGift', { n: nextStreakGift(streak) })}  ·  {t('quiz.best', { n: best })}
          </Text>
        </View>

        <Countdown />

        <View style={styles.actions}>
          <Pressable
            onPress={withTap(share)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <Text style={styles.shareText}>↗ {t('quiz.share')}</Text>
          </Pressable>
          <PrimaryButton label={t('quiz.backToMap')} variant="coral" onPress={onDone} />
        </View>
      </ScrollView>
      {!reduceMotion && burst > 0 && <Confetti key={burst} colors={PARTY} seed={quizNumber * 7 + burst} />}
    </View>
  );
}

function Line({ label, coins }: { label: string; coins: number }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineCoins}>+{coins} 🪙</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: 'stretch',
  },
  body: {
    alignItems: 'stretch',
    paddingBottom: 32,
    gap: 14,
  },
  headline: {
    marginTop: 8,
    fontSize: 34,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  row: {
    fontSize: 30,
    textAlign: 'center',
    letterSpacing: 4,
  },
  card: {
    padding: 16,
    borderRadius: sizes.radius,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(31,42,55,0.12)',
    gap: 6,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    fontSize: 18,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  lineCoins: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: '#B07F00',
  },
  chest: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: sizes.radius,
    backgroundColor: '#FFF1C9',
    borderWidth: 2,
    borderColor: colors.coinGold,
    borderStyle: 'dashed',
  },
  chestOpen: {
    borderStyle: 'solid',
  },
  chestIcon: {
    fontSize: 56,
  },
  chestTitle: {
    marginTop: 4,
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  chestTap: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  chestGot: {
    marginTop: 4,
    fontSize: 26,
    fontFamily: fonts.uiBold,
    color: '#B07F00',
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
  countdown: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    minHeight: sizes.touchTarget,
    minWidth: 200,
    paddingHorizontal: 24,
    borderRadius: sizes.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
  },
  shareText: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
