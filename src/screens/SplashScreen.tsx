import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { useSettings } from '../store/settings';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';

const SPLASH_MS = 1200;

export function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = useSettings.getState().onboarded;
      if (!onboarded) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Map');
      }
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Screen>
      <Text style={styles.logo}>WordEase</Text>
      <ActivityIndicator style={styles.spinner} size="large" color={colors.primaryOcean} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 48,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  spinner: {
    marginTop: 24,
  },
});
