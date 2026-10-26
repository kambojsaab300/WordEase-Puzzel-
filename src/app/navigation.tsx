import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AboutScreen } from '../screens/AboutScreen';
import { AlbumScreen } from '../screens/AlbumScreen';
import { GlobeScreen } from '../screens/GlobeScreen';
import { LevelScreen } from '../screens/LevelScreen';
import { MapScreen } from '../screens/MapScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { colors } from '../ui/theme';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Map: { focusWorld?: number } | undefined;
  Globe: undefined;
  Album: undefined;
  Level: { levelId: number };
  Result: { levelId: number; stars: 1 | 2 | 3; coins: number; worldCompleted: number | null };
  Settings: undefined;
  About: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// mohit

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bgCream },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Globe" component={GlobeScreen} />
        <Stack.Screen name="Album" component={AlbumScreen} />
        <Stack.Screen name="Level" component={LevelScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
