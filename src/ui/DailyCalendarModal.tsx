import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { getTodayKey, useDaily } from '../store/daily';
import { IconButton } from './IconButton';
import { PrimaryButton } from './PrimaryButton';
import { colors, fonts } from './theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPlayDaily: () => void;
};

export function DailyCalendarModal({ visible, onClose, onPlayDaily }: Props) {
  const streak = useDaily(s => s.streak);
  const freezes = useDaily(s => s.freezes);
  const done = useDaily(s => s.done);
  const todayKey = getTodayKey();
  const isTodayDone = Boolean(done[todayKey]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const todayDate = now.getDate();

  // Days in this month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const daysGrid = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  }, [firstDayIndex, totalDays]);

  const weekHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Daily Postcard</Text>
            <IconButton icon="✕" label="Close" onPress={onClose} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statText}>
                {streak} {streak === 1 ? 'day' : 'days'} streak
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statEmoji}>❄️</Text>
              <Text style={styles.statText}>
                {freezes} {freezes === 1 ? 'freeze' : 'freezes'}
              </Text>
            </View>
          </View>

          <Text style={styles.monthTitle}>
            {monthName} {year}
          </Text>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {weekHeaders.map((day, idx) => (
              <Text key={idx} style={styles.weekHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <View key={idx} style={styles.dayCellEmpty} />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const completed = Boolean(done[dateStr]);
              const isToday = day === todayDate;

              return (
                <View
                  key={idx}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    completed && styles.completedCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      completed && styles.completedText,
                    ]}
                  >
                    {day}
                  </Text>
                  {completed && <Text style={styles.stampCheck}>✓</Text>}
                </View>
              );
            })}
          </View>

          <View style={styles.actionSection}>
            {isTodayDone ? (
              <View style={styles.doneBanner}>
                <Text style={styles.doneText}>🎉 Today&apos;s Postcard Collected!</Text>
              </View>
            ) : (
              <PrimaryButton
                label="Play Today's Puzzle (+50 🪙)"
                variant="coral"
                onPress={() => {
                  onClose();
                  onPlayDaily();
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 55, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgCream,
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0D9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekHeader: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fonts.uiBold,
    color: '#8A99A8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: colors.accentCoral,
  },
  completedCell: {
    backgroundColor: '#E0F2E9',
  },
  dayText: {
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.ink,
  },
  todayText: {
    fontFamily: fonts.uiBold,
    color: colors.accentCoral,
  },
  completedText: {
    fontFamily: fonts.uiBold,
    color: colors.okGreen,
  },
  stampCheck: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    color: colors.okGreen,
    fontWeight: 'bold',
  },
  actionSection: {
    marginTop: 20,
  },
  doneBanner: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#E6F8EE',
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.okGreen,
  },
});
