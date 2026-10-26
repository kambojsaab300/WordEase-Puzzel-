import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { InputMode, useSettings } from '../store/settings';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';

export function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const currentSettings = useSettings();
  const update = useSettings(s => s.update);

  const [textScale, setTextScale] = useState<1 | 1.25 | 1.5>(currentSettings.textScale);
  const [inputMode, setInputMode] = useState<InputMode>(currentSettings.inputMode);

  const handleStart = () => {
    update({ textScale, inputMode, onboarded: true });
    navigation.replace('Level', { levelId: 1 });
  };

  const handleSkip = () => {
    update({ onboarded: true });
    navigation.replace('Map');
  };

  return (
    <Screen
      right={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={handleSkip}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to WordEase</Text>
        <Text style={styles.tagline}>
          Handcrafted word puzzles with big, clear letters for easy, relaxing play.
        </Text>

        {/* Step 1: Text Size */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>1. Choose Your Letter Size</Text>
          <View style={styles.segmentRow}>
            {([1, 1.25, 1.5] as const).map(scale => {
              const active = textScale === scale;
              const labels = { 1: 'Normal', 1.25: 'Large', 1.5: 'Huge' };
              return (
                <TouchableOpacity
                  key={scale}
                  onPress={() => setTextScale(scale)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {labels[scale]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.previewBox}>
            <Text style={[styles.previewLetter, { fontSize: 24 * textScale }]}>W O R D</Text>
          </View>
        </View>

        {/* Step 2: Input Mode */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>2. How Do You Prefer To Play?</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setInputMode('drag')}
              style={[styles.modeCard, inputMode === 'drag' && styles.modeCardActive]}
            >
              <Text style={[styles.modeTitle, inputMode === 'drag' && styles.modeTitleActive]}>
                👆 Drag & Draw
              </Text>
              <Text style={styles.modeDesc}>Glide your finger across letters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInputMode('tap')}
              style={[styles.modeCard, inputMode === 'tap' && styles.modeCardActive]}
            >
              <Text style={[styles.modeTitle, inputMode === 'tap' && styles.modeTitleActive]}>
                🎯 Tap-Tap
              </Text>
              <Text style={styles.modeDesc}>Tap start letter, then tap end letter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Start Level 1"
            variant="coral"
            onPress={handleStart}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  welcome: {
    fontSize: 28,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontFamily: fonts.ui,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 17,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryOcean,
  },
  segmentText: {
    fontSize: 15,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.white,
  },
  previewBox: {
    backgroundColor: colors.bgCream,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewLetter: {
    fontFamily: fonts.grid,
    color: colors.ink,
    letterSpacing: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
  },
  modeCardActive: {
    borderColor: colors.primaryOcean,
    backgroundColor: '#F0F9FB',
  },
  modeTitle: {
    fontSize: 15,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 4,
  },
  modeTitleActive: {
    color: colors.primaryOcean,
  },
  modeDesc: {
    fontSize: 12,
    fontFamily: fonts.ui,
    color: '#6B7280',
    lineHeight: 16,
  },
  footer: {
    marginTop: 8,
  },
});
