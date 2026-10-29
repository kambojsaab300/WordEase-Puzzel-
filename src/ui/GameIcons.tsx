import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, Path, RoundedRect } from '@shopify/react-native-skia';
import { colors } from './theme';

// Drawn icons for the round buttons: emoji looked different on every phone.
// Artwork is 24×24, scaled to the requested size; the same ocean outline, gold and coral everywhere.

const GOLD = '#FFCB2E';
const GOLD_DARK = '#E0A400';
const LAND = '#6DBB7C';

function IconCanvas({ size, children }: { size: number; children: ReactNode }) {
  return (
    <View pointerEvents="none">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 24 }]}>{children}</Group>
      </Canvas>
    </View>
  );
}

export function PauseIcon() {
  return (
    <View style={styles.pause}>
      <View style={styles.bar} />
      <View style={styles.bar} />
    </View>
  );
}

export function MinusIcon() {
  return <View style={styles.flatBar} />;
}

export function PlusIcon() {
  return (
    <View style={styles.plus}>
      <View style={styles.flatBar} />
      <View style={[styles.flatBar, styles.upright]} />
    </View>
  );
}

const RAYS = 'M12 1.2v1.7M4.3 4.3l1.2 1.2M19.7 4.3l-1.2 1.2M2.2 10.4h1.7M20.1 10.4h1.7';
const GLASS = 'M12 4.8a5.4 5.4 0 0 0-3.2 9.75c.7.53 1 1.15 1 1.95h4.4c0-.8.3-1.42 1-1.95A5.4 5.4 0 0 0 12 4.8z';
const SHINE = 'M9.5 9.6a2.8 2.8 0 0 1 1.8-2.2';
const BASE = 'M9.9 18.7h4.2M10.7 21.1h2.6';

export function BulbIcon({ size = 32 }: { size?: number }) {
  return (
    <IconCanvas size={size}>
      <Path path={RAYS} style="stroke" strokeWidth={1.7} strokeCap="round" color={GOLD_DARK} />
      <Path path={GLASS} color={GOLD} />
      <Path path={GLASS} style="stroke" strokeWidth={1.7} strokeJoin="round" color={colors.primaryOcean} />
      <Path path={SHINE} style="stroke" strokeWidth={1.4} strokeCap="round" color={colors.white} />
      <Path path={BASE} style="stroke" strokeWidth={2} strokeCap="round" color={colors.primaryOcean} />
    </IconCanvas>
  );
}

// Daily puzzle: a calendar page with a tick
export function CalendarIcon({ size = 30 }: { size?: number }) {
  return (
    <IconCanvas size={size}>
      <RoundedRect x={3.5} y={5.5} width={17} height={15} r={2.5} color={colors.white} />
      <Path path="M4.4 10V8a2.1 2.1 0 0 1 2.1-2.1h11a2.1 2.1 0 0 1 2.1 2.1v2z" color={colors.accentCoral} />
      <RoundedRect x={3.5} y={5.5} width={17} height={15} r={2.5} style="stroke" strokeWidth={1.8} color={colors.primaryOcean} />
      <Path path="M8 3.5v4M16 3.5v4" style="stroke" strokeWidth={2} strokeCap="round" color={colors.primaryOcean} />
      <Path
        path="M8.6 15.2l2.3 2.2 4.6-4.6"
        style="stroke"
        strokeWidth={2.1}
        strokeCap="round"
        strokeJoin="round"
        color={colors.okGreen}
      />
    </IconCanvas>
  );
}

// Settings: three sliders
export function SettingsIcon({ size = 30 }: { size?: number }) {
  return (
    <IconCanvas size={size}>
      <Path path="M4 7h16M4 12h16M4 17h16" style="stroke" strokeWidth={2} strokeCap="round" color={colors.primaryOcean} />
      {[
        [9, 7],
        [15.5, 12],
        [7.5, 17],
      ].map(([cx, cy]) => (
        <Group key={cy}>
          <Circle cx={cx} cy={cy} r={2.6} color={GOLD} />
          <Circle cx={cx} cy={cy} r={2.6} style="stroke" strokeWidth={1.6} color={colors.primaryOcean} />
        </Group>
      ))}
    </IconCanvas>
  );
}

// World Trip: a small globe
export function GlobeIcon({ size = 30 }: { size?: number }) {
  return (
    <IconCanvas size={size}>
      <Circle cx={12} cy={12} r={8.5} color="#BFE6F5" />
      <Path
        path="M6.6 8.4c1.6-.9 3.2-.3 3.9 1 .5 1.1-.6 2.1-.2 3.2.4 1.3-.7 2.5-1.9 2.3-1.5-.3-2.7-2.1-2.6-3.8 0-1.1.3-2 .8-2.7z"
        color={LAND}
      />
      <Path
        path="M13.4 5.2c1.6.2 3 1.2 2.9 2.4-.1 1-1.3 1.2-1.3 2.2 0 .9 1 1.2 1.7 1.8"
        style="stroke"
        strokeWidth={1.8}
        strokeCap="round"
        color={LAND}
      />
      <Path path="M14 14.2c1.3-.5 2.8.3 2.8 1.6 0 1.3-1.3 2.6-2.6 2.4-1-.2-1.3-1.3-1-2.2.2-.8.4-1.5.8-1.8z" color={LAND} />
      <Circle cx={12} cy={12} r={8.5} style="stroke" strokeWidth={1.8} color={colors.primaryOcean} />
    </IconCanvas>
  );
}

// Passport album
export function PassportIcon({ size = 30 }: { size?: number }) {
  return (
    <IconCanvas size={size}>
      <RoundedRect x={5} y={3} width={14} height={18} r={2} color={colors.primaryOcean} />
      <Circle cx={12} cy={10.5} r={3.4} style="stroke" strokeWidth={1.5} color={GOLD} />
      <Path
        path="M8.6 10.5h6.8M12 7.1c-1.3 1.1-1.3 5.7 0 6.8M12 7.1c1.3 1.1 1.3 5.7 0 6.8"
        style="stroke"
        strokeWidth={1.1}
        color={GOLD}
      />
      <Path path="M9 17h6" style="stroke" strokeWidth={1.6} strokeCap="round" color={GOLD} />
    </IconCanvas>
  );
}

// Back to the current stop on the route
export function PinIcon({ size = 30 }: { size?: number }) {
  const drop = 'M12 21.5s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z';
  return (
    <IconCanvas size={size}>
      <Path path={drop} color={colors.accentCoral} />
      <Path path={drop} style="stroke" strokeWidth={1.7} strokeJoin="round" color={colors.primaryOcean} />
      <Circle cx={12} cy={10.5} r={2.4} color={colors.white} />
    </IconCanvas>
  );
}

const styles = StyleSheet.create({
  pause: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    width: 6,
    height: 20,
    borderRadius: 3,
    backgroundColor: colors.primaryOcean,
  },
  plus: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatBar: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryOcean,
  },
  upright: {
    position: 'absolute',
    transform: [{ rotate: '90deg' }],
  },
});
