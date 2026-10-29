import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLDS } from '../game/levels/worlds';
import { LANDMARKS_PER_WORLD, visitedCount, worldLandmarks } from '../map/landmarkPlan';
import { useProgress } from '../store/progress';
import { PassportStamp } from '../ui/PassportStamp';
import { paperCard } from '../ui/PostcardFrame';
import { Screen } from '../ui/Screen';
import { colors, fonts, sizes } from '../ui/theme';
import { useT } from '../i18n';

const PAGE_BORDER = 1.5;
// border + padding on each side of the passport page
const PAGE_INSET = 8;

// One stamp per finished world, plus the 4 landmarks reached on its route: the long-term goal of the World Trip
export function AlbumScreen({ navigation }: ScreenProps<'Album'>) {
  const t = useT();
  const { width } = useWindowDimensions();
  const stars = useProgress(s => s.stars);
  const collected = WORLDS.filter(w => stars[w.id * LEVELS_PER_WORLD]).length;
  // Two stamps a row inside the passport page: its padding and border come off the width too
  const stampSize = Math.floor((width - sizes.gutter * 2 - 24 - PAGE_INSET * 2) / 2);

  return (
    <Screen title={t('album.title')} onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        <Text style={styles.count}>
          {t('album.count', { n: collected, total: WORLDS.length })}
        </Text>
        <Text style={styles.landmarkCount}>
          {t('album.landmarks', { n: visitedCount(stars), total: WORLDS.length * LANDMARKS_PER_WORLD })}
        </Text>
        <View style={styles.page}>
          {WORLDS.map(w => (
            <PassportStamp
              key={w.id}
              world={w}
              collected={Boolean(stars[w.id * LEVELS_PER_WORLD])}
              size={stampSize}
              visited={worldLandmarks(w.id).map(l => Boolean(stars[l.levelId]))}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignSelf: 'stretch',
  },
  grid: {
    paddingBottom: 24,
  },
  count: {
    fontSize: 19,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  landmarkCount: {
    marginBottom: 8,
    fontSize: 17,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
  },
  // a passport page lying on the table
  page: {
    ...paperCard,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
    padding: PAGE_INSET - PAGE_BORDER,
    borderWidth: PAGE_BORDER,
    borderRadius: 18,
  },
});
