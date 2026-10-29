import { ReactNode } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from './theme';

// Airmail edge: a seamless 40 dp tile of red, white, blue, white bands at 45°.
// A repeated image instead of a Skia canvas, so a list of 20 world cards stays light.
const AIRMAIL_TILE = require('../assets/ui/airmail.png');

/** Fills its parent with airmail stripes; the parent decides the shape (radius, overflow hidden). */
export function AirmailStripes() {
  return (
    <Image
      source={AIRMAIL_TILE}
      resizeMode="repeat"
      style={styles.tile}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

type Props = {
  children: ReactNode;
  /** Outer frame: size, margins, transforms */
  style?: StyleProp<ViewStyle>;
  /** The paper inside the stripes: padding, alignment */
  paperStyle?: StyleProp<ViewStyle>;
};

// A postcard: paper with an airmail-striped edge and a soft shadow on the table
export function PostcardFrame({ children, style, paperStyle }: Props) {
  return (
    <View style={[styles.frame, style]}>
      <View style={styles.stripes} pointerEvents="none">
        <AirmailStripes />
      </View>
      <View style={[styles.paper, paperStyle]}>{children}</View>
    </View>
  );
}

export const POSTCARD_EDGE = 5;

/**
 * A plain paper card on the table, for lists and sections. One airmail postcard per screen is
 * enough; everything around it is paper like this. Spread it into a StyleSheet entry.
 */
export const paperCard: ViewStyle = {
  backgroundColor: colors.paper,
  borderWidth: 1.5,
  borderColor: colors.tagBorder,
  elevation: 2,
  shadowColor: '#503214',
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  frame: {
    padding: POSTCARD_EDGE,
    borderRadius: 8,
    // elevation needs a solid background to cast its shadow
    backgroundColor: colors.paper,
    elevation: 8,
    shadowColor: '#503214',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  stripes: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  paper: {
    borderRadius: 3,
    backgroundColor: colors.paper,
  },
});
