import { useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { fitPace, paceSamples, playDataCsv } from '../game/difficulty/calibration';
import { getLevel, SHIPPED_LEVELS } from '../game/levels/levelRepo';
import { usePlayStats } from '../store/playStats';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';

// Shipped levels store the bot's typical seconds; Classic Play levels have no bot time
const botSecondsOf = (levelId: number) => (levelId <= SHIPPED_LEVELS ? getLevel(levelId).difficulty : undefined);

/**
 * Developer screen (long-press the version on About): how this phone's first wins compare
 * with the search bot. English on purpose; players never see it. Data stays on the phone
 * until "Share" is pressed.
 */
export function PlayStatsScreen({ navigation }: ScreenProps<'PlayStats'>) {
  const levels = usePlayStats(s => s.levels);
  const samples = useMemo(() => paceSamples(levels, botSecondsOf), [levels]);
  const fit = useMemo(() => fitPace(samples), [samples]);
  const rows = useMemo(
    () =>
      Object.entries(levels)
        .map(([id, play]) => ({ levelId: Number(id), play, bot: botSecondsOf(Number(id)) }))
        .sort((a, b) => a.levelId - b.levelId),
    [levels],
  );

  const share = () => Share.share({ message: playDataCsv(levels, botSecondsOf) });
  const clear = () =>
    Alert.alert('Clear play data?', 'Times and quits on this phone are deleted. Progress and coins stay.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => usePlayStats.getState().clear() },
    ]);

  return (
    <Screen title="Play data" onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {fit ? (
            <>
              <Text style={styles.big}>{fit.scale.toFixed(2)}×</Text>
              <Text style={styles.line}>your time ÷ bot time, typical level ({fit.n} first wins)</Text>
              <Text style={styles.line}>
                {fit.rankMatch === null
                  ? 'Win 5 levels to see if your times rank levels like the bot does.'
                  : `Rank match with the bot: ${fit.rankMatch.toFixed(2)} (1 = same order)`}
              </Text>
            </>
          ) : (
            <Text style={styles.line}>No first wins timed yet. Play a few new levels.</Text>
          )}
          <Text style={styles.note}>Only first wins count; Huge-text wins on a smaller grid are left out.</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <Text style={[styles.cell, styles.headText]}>Level</Text>
            <Text style={[styles.cell, styles.headText]}>You</Text>
            <Text style={[styles.cell, styles.headText]}>Bot</Text>
            <Text style={[styles.cell, styles.headText]}>Hints</Text>
            <Text style={[styles.cell, styles.headText]}>Quits</Text>
          </View>
          {rows.map(({ levelId, play, bot }) => (
            <View key={levelId} style={styles.row}>
              <Text style={styles.cell}>{levelId}</Text>
              <Text style={styles.cell}>
                {play.firstWin ? `${play.firstWin.seconds} s${play.firstWin.resized ? '*' : ''}` : '–'}
              </Text>
              <Text style={styles.cell}>{bot === undefined ? '–' : `${bot} s`}</Text>
              <Text style={styles.cell}>{play.firstWin ? play.firstWin.hints : '–'}</Text>
              <Text style={styles.cell}>{play.quits}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <PrimaryButton label="Share as text" onPress={share} />
          <PrimaryButton label="Clear play data" variant="coral" onPress={clear} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFF0D9',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  big: {
    fontSize: 36,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  line: {
    fontSize: 15,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    fontFamily: fonts.ui,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  table: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8D6',
  },
  head: {
    borderBottomWidth: 2,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  headText: {
    fontFamily: fonts.uiBold,
  },
  buttons: {
    gap: 12,
  },
});
