import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { SUPPORTED_LANGUAGES, useT } from '../i18n';
import { InputMode, useSettings } from '../store/settings';
import { resetAllProgress } from '../store/reset';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';

const SIZE_LABELS = { 1: 'textSize.normal', 1.25: 'textSize.large', 1.5: 'textSize.huge' } as const;

export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const t = useT();
  const settings = useSettings();
  const update = useSettings(s => s.update);

  const confirmReset = () => {
    Alert.alert(
      t('settings.reset'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetButton'),
          style: 'destructive',
          onPress: () => {
            resetAllProgress();
            navigation.popTo('Map');
          },
        },
      ],
    );
  };

  return (
    <Screen title={t('settings.title')} onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Text Size Control */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.textSize')}</Text>
          <Text style={styles.sectionDesc}>{t('settings.textSizeDesc')}</Text>
          <View style={styles.segmentRow}>
            {([1, 1.25, 1.5] as const).map(scale => {
              const active = settings.textScale === scale;
              const label = t(SIZE_LABELS[scale]);
              return (
                <TouchableOpacity
                  key={scale}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t('textSize.a11y', { size: label })}
                  onPress={() => update({ textScale: scale })}
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
            <Text style={[styles.previewText, { fontSize: 20 * settings.textScale }]}>
              {t('settings.preview')}
            </Text>
          </View>
        </View>

        {/* Input Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.selectWords')}</Text>
          <View style={styles.inputModeRow}>
            {(
              [
                { mode: 'drag', title: 'input.drag.title', desc: 'input.drag.desc' },
                { mode: 'tap', title: 'input.tap.title', desc: 'input.tap.desc' },
              ] as const
            ).map(opt => {
              const active = settings.inputMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  onPress={() => update({ inputMode: opt.mode as InputMode })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.modeCard, active && styles.modeCardActive]}
                >
                  <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                    {t(opt.title)}
                  </Text>
                  <Text style={styles.modeDesc}>{t(opt.desc)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Audio & Haptics */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.audio')}</Text>
          {/* Sound and music switches return with real audio (T24); today they would do nothing */}
          <SettingRow
            title={t('settings.haptics')}
            desc={t('settings.hapticsDesc')}
            value={settings.haptics}
            onToggle={val => update({ haptics: val })}
          />
        </View>

        {/* Accessibility & Visuals */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('settings.visuals')}</Text>
          <SettingRow
            title={t('settings.meanings')}
            desc={t('settings.meaningsDesc')}
            value={settings.meanings}
            onToggle={val => update({ meanings: val })}
          />
          <SettingRow
            title={t('settings.contrast')}
            desc={t('settings.contrastDesc')}
            value={settings.highContrast}
            onToggle={val => update({ highContrast: val })}
          />
          <SettingRow
            title={t('settings.colorBlind')}
            desc={t('settings.colorBlindDesc')}
            value={settings.colorBlind}
            onToggle={val => update({ colorBlind: val })}
          />
          <SettingRow
            title={t('settings.motion')}
            desc={t('settings.motionDesc')}
            value={settings.reduceMotion}
            onToggle={val => update({ reduceMotion: val })}
          />
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🌐 {t('settings.language')}</Text>
          <View style={styles.langGrid}>
            {SUPPORTED_LANGUAGES.map(item => {
              const active = (settings.lang || 'en') === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => update({ lang: item.code })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.langChip, active && styles.langChipActive]}
                >
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.actionText}>ℹ️ {t('settings.about')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.resetBtn} onPress={confirmReset}>
            <Text style={styles.resetText}>{t('settings.reset')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingRow({
  title,
  desc,
  value,
  onToggle,
}: {
  title: string;
  desc?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextCol}>
        <Text style={styles.settingTitle}>{title}</Text>
        {desc && <Text style={styles.settingSub}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        accessibilityLabel={title}
        accessibilityHint={desc}
        trackColor={{ false: '#D1D5DB', true: '#A0D8C5' }}
        thumbColor={value ? colors.okGreen : '#9CA3AF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    fontFamily: fonts.ui,
    color: '#6B7280',
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryOcean,
  },
  segmentText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.white,
  },
  previewBox: {
    backgroundColor: colors.bgCream,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewText: {
    fontFamily: fonts.grid,
    color: colors.ink,
  },
  inputModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
  },
  modeCardActive: {
    borderColor: colors.primaryOcean,
    backgroundColor: '#F0F9FB',
  },
  modeTitle: {
    fontSize: 16,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3E8D6',
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  settingSub: {
    fontSize: 13,
    fontFamily: fonts.ui,
    color: '#6B7280',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
  },
  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
  },
  dangerSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetText: {
    fontSize: 15,
    fontFamily: fonts.uiBold,
    color: '#DC2626',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  langChipActive: {
    backgroundColor: '#F0F9FB',
    borderColor: colors.primaryOcean,
  },
  langChipText: {
    fontSize: 14,
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  langChipTextActive: {
    color: colors.primaryOcean,
  },
});
