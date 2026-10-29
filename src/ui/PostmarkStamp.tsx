import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { POSTCARD_ASSETS, WorldId } from '../assets/postcards';

type Props = {
  world: number;
  /** Words found so far: the stamp thumps down each time it goes up */
  count: number;
  reduceMotion: boolean;
  size?: number;
};

// The world's postmark in the corner of the level postcard. Decorative only.
export function PostmarkStamp({ world, count, reduceMotion, size = 58 }: Props) {
  const scale = useSharedValue(1);
  // Resuming a saved level or restarting it must not thump; only a new find does
  const lastCount = useRef(count);

  useEffect(() => {
    const grew = count > lastCount.current;
    lastCount.current = count;
    if (!grew || reduceMotion) return;
    scale.value = withSequence(withTiming(1.35, { duration: 110 }), withSpring(1, { damping: 7, stiffness: 220 }));
  }, [count, reduceMotion, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ rotate: '-14deg' }, { scale: scale.value }] }));

  const assets = POSTCARD_ASSETS[world as WorldId];
  // The Daily puzzle (world 0) and Classic Play past the last world have no postmark
  if (!assets) return null;
  return (
    <Animated.Image
      source={assets.stamp}
      style={[styles.stamp, { width: size, height: size }, animated]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  stamp: {
    opacity: 0.9,
  },
});
