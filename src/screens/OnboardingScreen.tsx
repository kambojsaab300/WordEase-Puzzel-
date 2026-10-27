import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { InputMode, useSettings } from '../store/settings';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';
import { SUPPORTED_LANGUAGES, useT } from '../i18n';
import { AudioManager } from '../services/audio/AudioManager';
import { withTap } from '../ui/withTap';

const SIZE_LABELS = { 1: 'textSize.normal', 1.25: 'textSize.large', 1.5: 'textSize.huge' } as const;

export function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const t = useT();
  const lang = useSettings(s => s.lang);
  const currentSettings = useSettings();
  const update = useSettings(s => s.update);

  const [textScale, setTextScale] = useState<1 | 1.25 | 1.5>(currentSettings.textScale);
  const [inputMode, setInputMode] = useState<InputMode>(currentSettings.inputMode);

  // A first-time player hears the calm map music from the welcome screen on
  useEffect(() => AudioManager.startMusic('map'), []);

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
          accessibilityLabel={t('onboarding.skipA11y')}
          onPress={withTap(handleSkip)}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Language first, so a new player can read the rest */}
        <View style={styles.langRow}>
          {SUPPORTED_LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              onPress={withTap(() => update({ lang: l.code }))}
              accessibilityRole="radio"
              accessibilityState={{ selected: lang === l.code }}
              style={[styles.langChip, lang === l.code && styles.segmentBtnActive]}
            >
              <Text style={[styles.langText, lang === l.code && styles.segmentTextActive]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.welcome}>{t('onboarding.welcome')}</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>

        {/* Step 1: Text Size */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{t('onboarding.step1')}</Text>
          <View style={styles.segmentRow}>
            {([1, 1.25, 1.5] as const).map(scale => {
              const active = textScale === scale;
              const label = t(SIZE_LABELS[scale]);
              return (
                <TouchableOpacity
                  key={scale}
                  onPress={withTap(() => setTextScale(scale))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t('textSize.a11y', { size: label })}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {label}
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
          <Text style={styles.stepTitle}>{t('onboarding.step2')}</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={withTap(() => setInputMode('drag'))}
              style={[styles.modeCard, inputMode === 'drag' && styles.modeCardActive]}
            >
              <Text style={[styles.modeTitle, inputMode === 'drag' && styles.modeTitleActive]}>
                👆 {t('input.drag.title')}
              </Text>
              <Text style={styles.modeDesc}>{t('input.drag.desc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={withTap(() => setInputMode('tap'))}
              style={[styles.modeCard, inputMode === 'tap' && styles.modeCardActive]}
            >
              <Text style={[styles.modeTitle, inputMode === 'tap' && styles.modeTitleActive]}>
                🎯 {t('input.tap.title')}
              </Text>
              <Text style={styles.modeDesc}>{t('input.tap.desc')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('onboarding.start')}
            variant="coral"
            onPress={handleStart}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  langChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    margin: 4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primaryOcean,
    backgroundColor: colors.white,
  },
  langText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
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
