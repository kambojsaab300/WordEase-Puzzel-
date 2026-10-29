import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { LevelTag } from '../game/levels/levelSpec';
import { TAG_COLOR, TAG_LABEL } from '../ui/levelTag';
import { colors, fonts } from '../ui/theme';
import { useT } from '../i18n';

export type NodeState = 'locked' | 'current' | 'done';

type Props = {
  levelId: number;
  state: NodeState;
  stars: number;
  landmark: boolean;
  /** Last level of a world: gold rim */
  worldEnd: boolean;
  /** Name of the sight at a landmark level, read out with the node */
  landmarkName?: string;
  /** Hard / Super hard badge on the node's corner */
  tag: LevelTag | null;
  x: number;
  y: number;
  reduceMotion: boolean;
  onPress: (levelId: number) => void;
};

const SIZE = 56;
const CURRENT_SIZE = 74;
const LANDMARK_SIZE = 66;

// Colours from the "WordEase Level Map" design
const FILL: Record<NodeState, string> = {
  locked: '#EAE4DA',
  current: colors.accentCoral,
  done: colors.primaryOcean,
};
const TEXT: Record<NodeState, string> = {
  locked: '#5E574D',
  current: colors.ink,
  done: colors.white,
};
const RIM = '#FFFDF7';
const DROP = 'rgba(31,42,55,0.28)';
const DEPTH = 5;
const BADGE = 26;

export const LevelNode = memo(function LevelNodeView({
  levelId,
  state,
  stars,
  landmark,
  worldEnd,
  landmarkName,
  tag,
  x,
  y,
  reduceMotion,
  onPress,
}: Props) {
  const t = useT();
  const current = state === 'current';
  const size = current ? CURRENT_SIZE : landmark ? LANDMARK_SIZE : SIZE;

  // The current node sends out a soft coral ring so it is easy to spot
  const ring = useSharedValue(0);
  useEffect(() => {
    if (current && !reduceMotion) {
      ring.value = 0;
      ring.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false);
    } else {
      cancelAnimation(ring);
      ring.value = 0;
    }
  }, [current, reduceMotion, ring]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.65 * (1 - ring.value),
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  const stateLabel =
    state === 'locked'
      ? t('map.node.locked', { n: levelId })
      : current
        ? t('map.node.current', { n: levelId })
        : t('map.node.done', { n: levelId, stars });
  const named = landmarkName ? t('map.node.landmark', { label: stateLabel, name: landmarkName }) : stateLabel;
  const label = tag ? `${named}, ${t(TAG_LABEL[tag])}` : named;
  const round = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.wrap, { left: x - size / 2, top: y - size / 2, width: size }]}>
      {current && <Animated.View pointerEvents="none" style={[styles.ring, round, ringStyle]} />}
      <Pressable onPress={() => onPress(levelId)} accessibilityRole="button" accessibilityLabel={label}>
        <View style={{ width: size, height: size + DEPTH }}>
          <View style={[styles.drop, round]} />
          <View
            style={[
              styles.node,
              round,
              { backgroundColor: FILL[state] },
              landmark && styles.landmark,
              worldEnd && styles.worldEnd,
            ]}
          >
            <View style={[styles.shine, { width: size * 0.42, height: size * 0.2, borderRadius: size }]} />
            <Text style={[styles.number, { color: TEXT[state] }, current && styles.currentNumber]}>{levelId}</Text>
          </View>
          {tag && (
            <View style={[styles.badge, { backgroundColor: TAG_COLOR[tag] }]} accessible={false}>
              <Text style={styles.badgeIcon}>🔥</Text>
            </View>
          )}
        </View>
      </Pressable>
      {state === 'done' && stars > 0 && (
        <Text style={styles.stars} accessible={false}>
          {'★'.repeat(stars)}
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
  ring: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.accentCoral,
  },
  drop: {
    position: 'absolute',
    top: DEPTH,
    left: 0,
    backgroundColor: DROP,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: RIM,
  },
  shine: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  landmark: {
    borderStyle: 'dashed',
  },
  worldEnd: {
    borderWidth: 6,
    borderStyle: 'solid',
    borderColor: '#F5C842',
  },
  number: {
    fontSize: 20,
    fontFamily: fonts.uiBold,
  },
  // Sits on the rim at the top-right, clear of the stars below and the landmark art beside
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    borderColor: RIM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 13,
    includeFontPadding: false,
  },
  currentNumber: {
    fontSize: 26,
  },
  stars: {
    marginTop: 2,
    fontSize: 15,
    letterSpacing: 1,
    color: colors.coinGold,
    textShadowColor: '#7A5A00',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
});
