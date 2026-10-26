import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../ui/theme';
import { useT } from '../i18n';

export type NodeState = 'locked' | 'current' | 'done';

type Props = {
  levelId: number;
  state: NodeState;
  stars: number;
  landmark: boolean;
  x: number;
  y: number;
  reduceMotion: boolean;
  onPress: (levelId: number) => void;
};

const SIZE = 58;
const LANDMARK_SIZE = 78;

const FILL: Record<NodeState, string> = {
  locked: '#CFC8BA',
  current: colors.accentCoral,
  done: colors.primaryOcean,
};

export const LevelNode = memo(function LevelNodeView({
  levelId,
  state,
  stars,
  landmark,
  x,
  y,
  reduceMotion,
  onPress,
}: Props) {
  const t = useT();
  const size = landmark ? LANDMARK_SIZE : SIZE;

  // The current node breathes gently so it is easy to spot
  const scale = useSharedValue(1);
  useEffect(() => {
    if (state === 'current' && !reduceMotion) {
      scale.value = withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }
  }, [state, reduceMotion, scale]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const label =
    state === 'locked'
      ? t('map.node.locked', { n: levelId })
      : state === 'current'
        ? t('map.node.current', { n: levelId })
        : t('map.node.done', { n: levelId, stars });

  return (
    <View style={[styles.wrap, { left: x - size / 2, top: y - size / 2, width: size }]}>
      <Pressable onPress={() => onPress(levelId)} accessibilityRole="button" accessibilityLabel={label}>
        <Animated.View
          style={[
            styles.node,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: FILL[state] },
            landmark && styles.landmark,
            pulseStyle,
          ]}
        >
          <Text style={[styles.number, state === 'locked' && styles.lockedText, landmark && styles.bigNumber]}>
            {levelId}
          </Text>
          {state === 'locked' && <Text style={styles.lock}>🔒</Text>}
        </Animated.View>
      </Pressable>
      {state === 'done' && (
        <Text style={styles.stars} accessible={false}>
          {'★'.repeat(stars)}
          <Text style={styles.emptyStars}>{'★'.repeat(3 - stars)}</Text>
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 3,
  },
  landmark: {
    borderWidth: 4,
    borderStyle: 'dashed',
  },
  number: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
    color: colors.white,
  },
  bigNumber: {
    fontSize: 24,
  },
  lockedText: {
    color: '#7A7365',
  },
  lock: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    fontSize: 16,
  },
  stars: {
    marginTop: 2,
    fontSize: 15,
    color: colors.coinGold,
    textShadowColor: 'rgba(31,42,55,0.4)',
    textShadowRadius: 2,
  },
  emptyStars: {
    color: '#E8E1D2',
  },
});
