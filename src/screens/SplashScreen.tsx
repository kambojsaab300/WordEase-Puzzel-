import { useEffect, useRef } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  RoundedRect,
  Shadow,
  Text as SkText,
  useFont,
  type SkFont,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { ScreenProps } from '../app/navigation';
import { InAppUpdateManager } from '../services/update/InAppUpdateManager';
import { useSettings } from '../store/settings';
import { colors, fonts } from '../ui/theme';
import { useT } from '../i18n';
import { AudioManager } from '../services/audio/AudioManager';

const LOGO_FONT = require('../../assets/fonts/Nunito-Bold.ttf');

// Animated splash from "WordEase Splash Screen" design (390 x 844 artboard):
// letters pop in, WORD and EASE get highlighted, a coral sun rises over calm water, then the name and loader.
const ART_W = 390;
const ART_H = 844;
const INTRO_MS = 2800; // whole animation; the name lands at 2 s
const SPLASH_MS = 3200;

const WATER_BACK = '#2A8CA8';
const WATER_FRONT = '#4FA7BF';
const PILL_GOLD = '#F5C842';
const FAINT = 'rgba(255,248,236,0.42)';
const SHADOW = 'rgba(6,48,61,0.28)';

const COLS = [99, 163, 227, 291];
type Letter = { ch: string; x: number; y: number; delay: number; color: string };

const row = (word: string, y: number, start: number, step: number, color: string): Letter[] =>
  [...word].map((ch, i) => ({ ch, x: COLS[i], y, delay: start + i * step, color }));

const LETTERS: Letter[] = [
  ...row('PNTH', 211, 0, 50, FAINT),
  ...row('UYCM', 403, 450, 50, FAINT),
  ...row('WORD', 275, 150, 50, colors.bgCream),
  ...row('EASE', 339, 300, 50, colors.bgCream),
];
// Dark ink that fades in over WORD and EASE as each pill sweeps past
const INK: Letter[] = [...row('WORD', 275, 920, 100, colors.ink), ...row('EASE', 339, 1470, 100, colors.ink)];

const APP_NAME = 'WordEase';

export function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useSettings(s => s.reduceMotion);
  const font = useFont(LOGO_FONT, 44);
  const time = useSharedValue(reduceMotion ? INTRO_MS : 0);
  const drift = useSharedValue(0);
  const left = useRef(false);

  const s = width / ART_W;
  const bottomShift = height / s - ART_H;

  const goNext = () => {
    if (left.current) return;
    left.current = true;
    navigation.replace(useSettings.getState().onboarded ? 'Map' : 'Onboarding');
  };

  useEffect(() => {
    // Check Google Play Store for in-app updates on startup
    InAppUpdateManager.checkAndPrompt(false).catch(() => {});
    AudioManager.stopMusic();
    AudioManager.playSplash();

    if (!reduceMotion) {
      time.value = withTiming(INTRO_MS, { duration: INTRO_MS, easing: Easing.linear });
      drift.value = withRepeat(withTiming(16, { duration: 9000, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
    const timer = setTimeout(goNext, SPLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cloudA = useDerivedValue(() => [{ translateX: drift.value }]);
  const cloudB = useDerivedValue(() => [{ translateX: 16 - drift.value }]);
  const sun = useDerivedValue(() => {
    const p = Easing.out(Easing.cubic)(clamp01((time.value - 1400) / 1300));
    return [{ translateY: 96 * (1 - p) }];
  });
  const pill1 = useSweep(time, 850);
  const pill2 = useSweep(time, 1400);

  const nameStyle = useAnimatedStyle(() => {
    const p = Easing.out(Easing.quad)(clamp01((time.value - 2000) / 600));
    return { opacity: p, transform: [{ translateY: 14 * (1 - p) }] };
  });
  const loaderStyle = useAnimatedStyle(() => ({ opacity: clamp01((time.value - 2400) / 400) }));

  return (
    <Pressable
      style={styles.root}
      onPress={goNext}
      accessibilityRole="button"
      accessibilityLabel={`${APP_NAME}, ${t('app.tagline')}`}
    >
      <StatusBar barStyle="light-content" />
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ scale: s }]}>
          <Group transform={cloudA} opacity={0.9}>
            <Cloud x={34} y={96} w={112} h={22} bumps={[[66, 98, 18], [100, 88, 24], [130, 100, 15]]} />
          </Group>
          <Group transform={cloudB} opacity={0.75}>
            <Cloud x={262} y={140} w={86} h={18} bumps={[[286, 142, 14], [312, 134, 18], [336, 144, 11]]} />
          </Group>

          <Group transform={[{ translateY: bottomShift }]}>
            <Group transform={sun}>
              <Circle cx={292} cy={716} r={66} color={colors.accentCoral} />
              <Circle cx={292} cy={716} r={48} color="rgba(255,255,255,0.2)" />
            </Group>
            <Path path="M0 716Q98 690 195 708T390 702V844H0Z" color={WATER_BACK}>
              <Shadow dx={0} dy={4} blur={5} color={SHADOW} />
            </Path>
            <Path path="M0 772Q98 748 195 766T390 760V844H0Z" color={WATER_FRONT}>
              <Shadow dx={0} dy={4} blur={5} color={SHADOW} />
            </Path>
          </Group>

          <Group transform={pill1} origin={{ x: 61, y: 260 }}>
            <RoundedRect x={61} y={232} width={268} height={56} r={28} color={PILL_GOLD} />
          </Group>
          <Group transform={pill2} origin={{ x: 61, y: 324 }}>
            <RoundedRect x={61} y={296} width={268} height={56} r={28} color={colors.accentCoral} />
          </Group>

          {font &&
            LETTERS.map(l => <PopLetter key={`${l.ch}${l.x}${l.y}`} letter={l} font={font} time={time} />)}
          {font && INK.map(l => <InkLetter key={`ink${l.ch}${l.x}${l.y}`} letter={l} font={font} time={time} />)}
        </Group>
      </Canvas>

      <View style={[styles.overlay, { top: height * 0.56 }]} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.nameRow, nameStyle]}>
          <Text style={[styles.name, { fontSize: width * 0.123 }]}>{'Word'}</Text>
          <View style={styles.easePill}>
            <Text style={[styles.name, styles.easeText, { fontSize: width * 0.123 }]}>{'Ease'}</Text>
          </View>
        </Animated.View>
      </View>
      <Animated.View
        style={[styles.overlay, styles.loader, { top: height * 0.66 }, loaderStyle]}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
      >
        {[0, 1, 2].map(i => (
          <Dot key={i} index={i} size={width * 0.024} still={reduceMotion} />
        ))}
      </Animated.View>
    </Pressable>
  );
}

function clamp01(v: number) {
  'worklet';
  return Math.min(1, Math.max(0, v));
}

const sweepEase = Easing.bezier(0.3, 0.7, 0.3, 1).factory();
const popEase = Easing.out(Easing.back(1.8));

// Pill grows from its left edge, like a finger swiping the found word
function useSweep(time: SharedValue<number>, start: number) {
  return useDerivedValue(() => {
    const p = sweepEase(clamp01((time.value - start) / 500));
    return [{ scaleX: Math.max(0.0001, p) }];
  });
}

function PopLetter({ letter, font, time }: { letter: Letter; font: SkFont; time: SharedValue<number> }) {
  const p = useDerivedValue(() => clamp01((time.value - letter.delay) / 450));
  const opacity = useDerivedValue(() => p.value);
  const transform = useDerivedValue(() => [{ scale: 0.4 + 0.6 * popEase(p.value) }]);
  const x = letter.x - font.measureText(letter.ch).width / 2;
  return (
    <Group opacity={opacity} transform={transform} origin={{ x: letter.x, y: letter.y - 16 }}>
      <SkText x={x} y={letter.y} text={letter.ch} font={font} color={letter.color} />
    </Group>
  );
}

function InkLetter({ letter, font, time }: { letter: Letter; font: SkFont; time: SharedValue<number> }) {
  const opacity = useDerivedValue(() => clamp01((time.value - letter.delay) / 180));
  const x = letter.x - font.measureText(letter.ch).width / 2;
  return (
    <Group opacity={opacity}>
      <SkText x={x} y={letter.y} text={letter.ch} font={font} color={letter.color} />
    </Group>
  );
}

type CloudProps = { x: number; y: number; w: number; h: number; bumps: [number, number, number][] };

function Cloud({ x, y, w, h, bumps }: CloudProps) {
  return (
    <Group>
      <Shadow dx={0} dy={4} blur={5} color={SHADOW} />
      <RoundedRect x={x} y={y} width={w} height={h} r={h / 2} color={colors.bgCream} />
      {bumps.map(([cx, cy, r]) => (
        <Circle key={cx} cx={cx} cy={cy} r={r} color={colors.bgCream} />
      ))}
    </Group>
  );
}

function Dot({ index, size, still }: { index: number; size: number; still: boolean }) {
  const blink = useSharedValue(still ? 1 : 0.35);
  useEffect(() => {
    if (still) return;
    blink.value = withDelay(
      index * 200,
      withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.35, { duration: 600 })), -1),
    );
  }, [blink, index, still]);
  const style = useAnimatedStyle(() => ({ opacity: blink.value }));
  return <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primaryOcean,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.uiBold,
    color: colors.bgCream,
    includeFontPadding: false,
  },
  easePill: {
    marginLeft: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.accentCoral,
  },
  easeText: {
    color: colors.ink,
  },
  loader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    backgroundColor: PILL_GOLD,
  },
});
