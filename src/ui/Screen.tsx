import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { colors, fonts, sizes } from './theme';
import { useT } from '../i18n';

type Props = {
  title?: string;
  onBack?: () => void;
  left?: ReactNode; // replaces the back button (e.g. the Level screen's pause button)
  right?: ReactNode;
  children: ReactNode;
};

// Common screen shell: cream background, safe area, optional top bar
export function Screen({ title, onBack, left, right, children }: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const showTopBar = Boolean(title || onBack || left || right);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {showTopBar && (
        <View style={styles.topBar}>
          <View style={styles.side}>
            {left ?? (onBack && <IconButton icon="←" label={t('common.back')} onPress={onBack} />)}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.side, styles.sideRight]}>{right}</View>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCream,
    paddingHorizontal: sizes.gutter,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  side: {
    width: sizes.touchTarget,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
