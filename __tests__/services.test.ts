import { SUPPORTED_LANGUAGES, t } from '../src/i18n';
import { AnalyticsManager } from '../src/services/analytics/AnalyticsManager';
import { AudioManager } from '../src/services/audio/AudioManager';
import { HapticsManager } from '../src/services/haptics/HapticsManager';
import { useSettings } from '../src/store/settings';

describe('Services & Localization', () => {
  beforeEach(() => {
    useSettings.setState({ sfx: 0.8, music: 0.5, haptics: true, lang: 'en' });
    AnalyticsManager.clearForTesting();
  });

  describe('AudioManager', () => {
    it('returns sfx and music volume from settings', () => {
      expect(AudioManager.getSfxVolume()).toBe(0.8);
      expect(AudioManager.getMusicVolume()).toBe(0.5);
    });

    it('plays sound events without throwing errors', () => {
      expect(() => {
        AudioManager.playLetterTouch();
        AudioManager.playDragTick(1);
        AudioManager.playWordFound();
        AudioManager.playWrongSelection();
        AudioManager.playLevelComplete();
        AudioManager.playCoinGain();
        AudioManager.playButtonTap();
      }).not.toThrow();
    });

    it('silently ignores playback when SFX is disabled', () => {
      useSettings.setState({ sfx: 0 });
      expect(() => AudioManager.playWordFound()).not.toThrow();
    });
  });

  describe('HapticsManager', () => {
    it('executes vibration methods safely', () => {
      expect(() => {
        HapticsManager.selectionTick();
        HapticsManager.wordFound();
        HapticsManager.buttonTap();
        HapticsManager.levelComplete();
        HapticsManager.errorThud();
      }).not.toThrow();
    });
  });

  describe('AnalyticsManager', () => {
    it('records and retrieves game lifecycle events', () => {
      AnalyticsManager.logLevelStart(1, 1);
      AnalyticsManager.logWordFound(1, 4, 'E');
      AnalyticsManager.logLevelComplete(1, 3, 0);

      const events = AnalyticsManager.getRecentEvents();
      expect(events.length).toBe(3);
      expect(events[0].event.name).toBe('level_start');
      expect(events[1].event.name).toBe('word_found');
      expect(events[2].event.name).toBe('level_complete');
    });

    it('records setting changes', () => {
      AnalyticsManager.logSettingChange('textScale', 1.5);
      const events = AnalyticsManager.getRecentEvents();
      expect(events.length).toBe(1);
      expect(events[0].event.name).toBe('setting_change');
    });
  });

  describe('Localization (i18n)', () => {
    it('translates basic UI keys in English by default', () => {
      expect(t('play')).toBe('Play');
      expect(t('settings')).toBe('Settings');
      expect(t('appName')).toBe('WordEase');
    });

    it('translates keys in Spanish', () => {
      expect(t('play', 'es')).toBe('Jugar');
      expect(t('dailyPostcard', 'es')).toBe('Postal Diaria');
      expect(t('removeAds', 'es')).toBe('Quitar Anuncios');
    });

    it('translates keys in Hindi', () => {
      expect(t('play', 'hi')).toBe('खेलें');
      expect(t('settings', 'hi')).toBe('सेटिंग्स');
      expect(t('coins', 'hi')).toBe('सिक्के');
    });

    it('translates keys in German, Portuguese, and French', () => {
      expect(t('play', 'de')).toBe('Spielen');
      expect(t('play', 'pt')).toBe('Jogar');
      expect(t('play', 'fr')).toBe('Jouer');
    });

    it('lists 6 supported languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(6);
      expect(SUPPORTED_LANGUAGES.map(l => l.code)).toEqual(['en', 'es', 'pt', 'de', 'fr', 'hi']);
    });
  });
});
