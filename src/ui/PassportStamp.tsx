import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import type { WorldDef } from '../game/levels/worlds';
import { LANDMARK_PATHS } from '../map/landmarks';
import { colors, fonts } from './theme';

type Props = {
  world: WorldDef;
  collected: boolean;
  size?: number;
};

export function PassportStamp({ world, collected, size = 150 }: Props) {
  const art = size * 0.48;
  return (
    <View
      style={[
        styles.stamp,
        { width: size, minHeight: size * 1.1 },
        collected
          ? { backgroundColor: world.palette.sky, borderColor: world.palette.accent }
          : styles.empty,
      ]}
      accessibilityLabel={collected ? `${world.name} stamp, collected` : `${world.name} stamp, not collected yet`}
    >
      {collected ? (
        <Canvas style={{ width: art, height: art }}>
          <Group transform={[{ scale: art / 100 }]}>
            <Path path={LANDMARK_PATHS[world.landmark]} color={world.palette.accent} />
          </Group>
        </Canvas>
      ) : (
        <Text style={[styles.question, { height: art, fontSize: art * 0.7 }]}>?</Text>
      )}
      <Text style={styles.world}>World {world.id}</Text>
      <Text style={[styles.name, !collected && styles.muted]} numberOfLines={2}>
        {world.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    margin: 6,
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  empty: {
    backgroundColor: '#EFE8DA',
    borderColor: '#CFC8BA',
  },
  question: {
    fontFamily: fonts.uiBold,
    color: '#CFC8BA',
    textAlign: 'center',
  },
  world: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
  },
  name: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  muted: {
    color: '#7A7365',
  },
});
