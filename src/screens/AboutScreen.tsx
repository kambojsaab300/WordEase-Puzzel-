import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScreenProps } from '../app/navigation';
import { paperCard, PostcardFrame } from '../ui/PostcardFrame';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Screen } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';
import { useT } from '../i18n';

export function AboutScreen({ navigation }: ScreenProps<'About'>) {
  const t = useT();
  return (
    <Screen title={t('about.title')} onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <PostcardFrame style={styles.card} paperStyle={styles.cardPaper}>
          <Text style={styles.appTitle}>WordEase: Word Search Puzzle</Text>
          {/* Long-press opens the developer's Play data screen; nothing shows it is there */}
          <Text
            style={styles.version}
            onLongPress={() => navigation.navigate('PlayStats')}
            suppressHighlighting
          >
            {t('about.version', { v: '1.0.0' })}
          </Text>
          <Text style={styles.description}>{t('about.intro')}</Text>
          <Text style={styles.version}>{t('about.legalNote')}</Text>
        </PostcardFrame>

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
            World map country outlines: Natural Earth, public domain (naturalearthdata.com).
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
    marginBottom: 20,
  },
  cardPaper: {
    padding: 18,
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
    ...paperCard,
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
