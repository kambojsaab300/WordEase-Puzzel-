import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Cell } from '../game/types';
import type { InputMode } from '../store/settings';

const HAND = 44;
const MOVE_MS = 1400;
const PAUSE_MS = 700;

type Props = {
  from: Cell;
  to: Cell;
  cellSize: number;
  inputMode: InputMode;
  reduceMotion: boolean;
};

// Level 1 helper: a hand showing how to select the first word (drag, or tap-tap)
export function TutorialHand({ from, to, cellSize, inputMode, reduceMotion }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(t);
    t.value = 0;
    if (reduceMotion) return;
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: MOVE_MS, easing: Easing.inOut(Easing.quad) }),
        withDelay(PAUSE_MS, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [t, reduceMotion, inputMode]);

  const [fx, fy] = [from[1] * cellSize + cellSize / 2, from[0] * cellSize + cellSize / 2];
  const [tx, ty] = [to[1] * cellSize + cellSize / 2, to[0] * cellSize + cellSize / 2];
  const tap = inputMode === 'tap';

  const style = useAnimatedStyle(() => {
    // Tap-Tap jumps from the first letter to the last; drag glides between them
    const progress = tap ? (t.value < 0.5 ? 0 : 1) : t.value;
    const press = tap ? 1 - 0.15 * Math.sin(((t.value * 2) % 1) * Math.PI) : 1;
    // The fingertip is near the top centre of the emoji
    return {
      transform: [
        { translateX: fx + (tx - fx) * progress - HAND / 2 },
        { translateY: fy + (ty - fy) * progress - 6 },
        { scale: press },
      ],
    };
  });

  return (
    <Animated.Text
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no"
      style={[styles.hand, style]}
    >
      👆
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  hand: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HAND,
    fontSize: HAND - 4,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowRadius: 6,
  },
});
