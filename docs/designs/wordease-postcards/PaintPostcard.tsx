import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import worlds from './worlds.json';
import { POSTCARD_ASSETS, type WorldId } from './index';

type Props = {
  world: WorldId;
  /** 0 = grey sketch, 1 = fully painted. Drive it with withTiming(levelsDone / levelsInWorld). */
  paint: SharedValue<number>;
};

export function PaintPostcard({ world, paint }: Props) {
  const info = worlds.find(w => w.world === world)!;
  const art = POSTCARD_ASSETS[world];
  const colorLayer = useAnimatedStyle(() => ({ opacity: paint.value }));

  return (
    <View style={styles.card}>
      <View style={styles.art} accessible accessibilityRole="image" accessibilityLabel={info.alt}>
        <Image source={art.gray} style={styles.fill} />
        <Animated.Image source={art.color} style={[styles.fill, colorLayer]} />
      </View>
      <View style={styles.row}>
        <View style={styles.names}>
          <Text style={styles.eyebrow}>WORLD {info.world} · {info.country}</Text>
          <Text style={styles.title}>{info.name}</Text>
          <Text style={styles.local}>{info.local}</Text>
        </View>
        <Image source={art.stamp} style={styles.stamp} accessibilityIgnoresInvertColors />
      </View>
      <Text style={styles.factLabel}>DID YOU KNOW?</Text>
      <Text style={styles.fact}>{info.fact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF8EC', borderRadius: 22, padding: 14, gap: 12 },
  art: { width: '100%', aspectRatio: 1080 / 489, borderRadius: 16, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  names: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color: '#0E6E8C' },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2A37' },
  local: { fontSize: 18, color: '#4B5563' },
  stamp: { width: 88, height: 88 },
  factLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color: '#B4472E' },
  fact: { fontSize: 20, lineHeight: 29, color: '#1F2A37' },
});
