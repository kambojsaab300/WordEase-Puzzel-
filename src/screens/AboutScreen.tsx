import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';
import { useT } from '../i18n';

export function AboutScreen({ navigation }: ScreenProps<'About'>) {
  const t = useT();
  return (
    <Screen title={t('about.title')} onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.appTitle}>WordEase: Word Search Puzzle</Text>
          <Text style={styles.version}>{t('about.version', { v: '1.0.0' })}</Text>
          <Text style={styles.description}>{t('about.intro')}</Text>
          <Text style={styles.version}>{t('about.legalNote')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.fonts')}</Text>
          <Text style={styles.licenseItemTitle}>Atkinson Hyperlegible</Text>
          <Text style={styles.licenseBody}>
            Designed by Braille Institute of America. Licensed under the SIL Open Font License, Version 1.1.
            Specially crafted for optimal legibility and distinction for low-vision readers.
          </Text>

          <Text style={styles.licenseItemTitle}>Nunito</Text>
          <Text style={styles.licenseBody}>
            Designed by Vernon Adams. Licensed under the SIL Open Font License, Version 1.1.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.dictionary')}</Text>
          <Text style={styles.licenseItemTitle}>WordNet 3.0</Text>
          <Text style={styles.licenseBody}>
            This software includes WordNet 3.0 Copyright 2006 by Princeton University.
            All rights reserved. WordNet is provided on an &quot;as is&quot; basis and Princeton University makes
            no representations or warranties of any kind.
          </Text>

          <Text style={styles.licenseItemTitle}>ENABLE Word List</Text>
          <Text style={styles.licenseBody}>
            Enhanced North American Benchmark Lexicon. Dedicated to the public domain.
          </Text>

          <Text style={styles.licenseItemTitle}>Word filter</Text>
          <Text style={styles.licenseBody}>
            Puzzles are checked against the &quot;List of Dirty, Naughty, Obscene, and Otherwise Bad
            Words&quot; by LDNOOBW, licensed under CC BY 4.0.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.art')}</Text>
          <Text style={styles.licenseBody}>
            Landmark silhouettes, the paper plane and clouds are original WordEase artwork.
          </Text>
          <Text style={styles.licenseItemTitle}>Natural Earth</Text>
          <Text style={styles.licenseBody}>
            Globe coastlines: Natural Earth 1:110m land, public domain (naturalearthdata.com).
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('common.back')}
            variant="ocean"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFF0D9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    textAlign: 'center',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: fonts.ui,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.ui,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.uiBold,
    color: colors.ink,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8D6',
    paddingBottom: 6,
  },
  licenseItemTitle: {
    fontSize: 16,
    fontFamily: fonts.uiBold,
    color: colors.primaryOcean,
    marginTop: 8,
    marginBottom: 4,
  },
  licenseBody: {
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 6,
  },
  footer: {
    marginTop: 12,
  },
});
