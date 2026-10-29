import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { POSTCARD_ASSETS, type WorldId } from '../../assets/postcards';
import { AirmailStripes } from '../PostcardFrame';

const EDGE = ['#DDD4BF', '#D3C9B2', '#C9BFA6', '#BFB59B', '#B5AB91'];

type Props = {
  worldId: number;
  width: number;
  reduceMotion: boolean;
  accessibilityLabel: string;
};

// Tilted paper postcard that paints from grey sketch to colour, then catches a shine and sways gently
export function CelebrationPostcard({ worldId, width, reduceMotion, accessibilityLabel }: Props) {
  const art = POSTCARD_ASSETS[worldId as WorldId];
  const paint = useSharedValue(reduceMotion ? 1 : 0);
  const shine = useSharedValue(reduceMotion ? 1 : 0);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    paint.value = withDelay(1700, withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }));
    shine.value = withDelay(3000, withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }));
    sway.value = withDelay(
      2800,
      withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [paint, reduceMotion, shine, sway]);

  const tilt = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${9 - 2 * sway.value}deg` },
      { rotateY: `${-11 + 7 * sway.value}deg` },
      { rotateZ: `${-1.5 + 0.5 * sway.value}deg` },
    ],
  }));
  const colour = useAnimatedStyle(() => ({ opacity: paint.value }));
  const shineStyle = useAnimatedStyle(() => ({
    opacity: shine.value > 0 && shine.value < 1 ? 1 : 0,
    transform: [{ translateX: (-1.3 + 2.6 * shine.value) * width }, { rotate: '15deg' }],
  }));

  return (
    <Animated.View style={[{ width }, tilt]} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {/* stacked paper edge under the card */}
      {EDGE.map((c, i) => (
        <View key={c} style={[styles.edge, { top: i + 1, bottom: -(i + 1), backgroundColor: c }]} />
      ))}
      <View style={styles.shadow} />
      <View style={styles.card}>
        {/* airmail edge, like every postcard in the app */}
        <View style={styles.fill} pointerEvents="none">
          <AirmailStripes />
        </View>
        <View style={styles.paper}>
          <View style={styles.photo}>
            {art && <Image source={art.gray} style={styles.fill} />}
            {art && <Animated.Image source={art.color} style={[styles.fill, colour]} />}
          </View>
        </View>
        <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 10,
  },
  shadow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 18,
    bottom: -18,
    borderRadius: 14,
    backgroundColor: 'rgba(0,25,40,0.35)',
  },
  card: {
    padding: 5,
    borderRadius: 10,
    backgroundColor: '#FFFDF6',
    overflow: 'hidden',
  },
  paper: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FFFDF6',
  },
  photo: {
    width: '100%',
    aspectRatio: 1080 / 489,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E4DDCF',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  shine: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: '22%',
    left: '39%',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
