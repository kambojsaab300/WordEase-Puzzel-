import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLDS } from '../game/levels/worlds';
import { useProgress } from '../store/progress';
import { PassportStamp } from '../ui/PassportStamp';
import { Screen } from '../ui/Screen';
import { colors, fonts, sizes } from '../ui/theme';

// One stamp per finished world: the long-term goal of the World Trip
export function AlbumScreen({ navigation }: ScreenProps<'Album'>) {
  const { width } = useWindowDimensions();
  const stars = useProgress(s => s.stars);
  const collected = WORLDS.filter(w => stars[w.id * LEVELS_PER_WORLD]).length;
  const stampSize = Math.floor((width - sizes.gutter * 2 - 24) / 2);

  return (
    <Screen title="Passport" onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        <Text style={styles.count}>
          {collected} of {WORLDS.length} stamps collected
        </Text>
        <View style={styles.row}>
          {WORLDS.map(w => (
            <PassportStamp
              key={w.id}
              world={w}
              collected={Boolean(stars[w.id * LEVELS_PER_WORLD])}
              size={stampSize}
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
    marginBottom: 8,
    fontSize: 19,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
