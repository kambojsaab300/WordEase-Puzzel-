import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** The dimmed backdrop: colour and side padding */
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

// Centred dialog body for an edge-to-edge Modal: the backdrop fills the whole screen,
// the card stays clear of the status and navigation bars, and scrolls when it is taller than the screen.
export function ModalScroll({ style, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[style, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  content: {
    alignItems: 'center',
  },
});
