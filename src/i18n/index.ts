import { useSettings } from '../store/settings';

export type TranslationKey =
  | 'appName'
  | 'tagline'
  | 'play'
  | 'dailyPostcard'
  | 'settings'
  | 'passport'
  | 'worldTrip'
  | 'levelComplete'
  | 'continue'
  | 'nextLevel'
  | 'coins'
  | 'removeAds'
  | 'freeCoins'
  | 'textSize'
  | 'inputMode'
  | 'dragMode'
  | 'tapMode'
  | 'soundEffects'
  | 'music'
  | 'vibration'
  | 'meanings'
  | 'highContrast'
  | 'colorBlind'
  | 'reduceMotion'
  | 'about'
  | 'resetProgress';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    appName: 'WordEase',
    tagline: 'Word Search Puzzle',
    play: 'Play',
    dailyPostcard: 'Daily Postcard',
    settings: 'Settings',
    passport: 'Passport',
    worldTrip: 'World Trip',
    levelComplete: 'Level Complete!',
    continue: 'Continue',
    nextLevel: 'Next Level',
    coins: 'Coins',
    removeAds: 'Remove Ads',
    freeCoins: 'Free 50 Coins',
    textSize: 'Text Size',
    inputMode: 'Input Mode',
    dragMode: 'Drag & Draw',
    tapMode: 'Tap-Tap',
    soundEffects: 'Sound Effects',
    music: 'Background Music',
    vibration: 'Vibration & Haptics',
    meanings: 'Word Meanings',
    highContrast: 'High Contrast Mode',
    colorBlind: 'Color-blind Palette',
    reduceMotion: 'Reduce Motion',
    about: 'About & Licenses',
    resetProgress: 'Reset All Progress',
  },
  es: {
    appName: 'WordEase',
    tagline: 'Sopa de Letras',
    play: 'Jugar',
    dailyPostcard: 'Postal Diaria',
    settings: 'Ajustes',
    passport: 'Pasaporte',
    worldTrip: 'Viaje Mundial',
    levelComplete: '¡Nivel Completado!',
    continue: 'Continuar',
    nextLevel: 'Siguiente Nivel',
    coins: 'Monedas',
    removeAds: 'Quitar Anuncios',
    freeCoins: '50 Monedas Gratis',
    textSize: 'Tamaño del Texto',
    inputMode: 'Modo de Entrada',
    dragMode: 'Arrastrar',
    tapMode: 'Tocar-Tocar',
    soundEffects: 'Efectos de Sonido',
    music: 'Música Relajante',
    vibration: 'Vibración',
    meanings: 'Significados',
    highContrast: 'Alto Contraste',
    colorBlind: 'Modo Daltónico',
    reduceMotion: 'Reducir Movimiento',
    about: 'Acerca de y Licencias',
    resetProgress: 'Reiniciar Progreso',
  },
  pt: {
    appName: 'WordEase',
    tagline: 'Caça-Palavras',
    play: 'Jogar',
    dailyPostcard: 'Cartão Postal Diário',
    settings: 'Configurações',
    passport: 'Passaporte',
    worldTrip: 'Viagem Mundial',
    levelComplete: 'Nível Concluído!',
    continue: 'Continuar',
    nextLevel: 'Próximo Nível',
    coins: 'Moedas',
    removeAds: 'Remover Anúncios',
    freeCoins: '50 Moedas Grátis',
    textSize: 'Tamanho do Texto',
    inputMode: 'Modo de Seleção',
    dragMode: 'Arrastar',
    tapMode: 'Toque-Toque',
    soundEffects: 'Efeitos Sonoros',
    music: 'Música de Fundo',
    vibration: 'Vibração',
    meanings: 'Significados',
    highContrast: 'Alto Contraste',
    colorBlind: 'Paleta Daltônica',
    reduceMotion: 'Reduzir Movimento',
    about: 'Sobre e Licenças',
    resetProgress: 'Redefinir Progresso',
  },
  de: {
    appName: 'WordEase',
    tagline: 'Wortsuche',
    play: 'Spielen',
    dailyPostcard: 'Tägliche Postkarte',
    settings: 'Einstellungen',
    passport: 'Reisepass',
    worldTrip: 'Weltreise',
    levelComplete: 'Level Abgeschlossen!',
    continue: 'Weiter',
    nextLevel: 'Nächstes Level',
    coins: 'Münzen',
    removeAds: 'Werbung Entfernen',
    freeCoins: '50 Gratismünzen',
    textSize: 'Schriftgröße',
    inputMode: 'Eingabemodus',
    dragMode: 'Ziehen',
    tapMode: 'Tippen',
    soundEffects: 'Toneffekte',
    music: 'Hintergrundmusik',
    vibration: 'Vibration',
    meanings: 'Bedeutungen',
    highContrast: 'Hoher Kontrast',
    colorBlind: 'Farbenblind-Modus',
    reduceMotion: 'Bewegung Reduzieren',
    about: 'Über & Lizenzen',
    resetProgress: 'Fortschritt Zurücksetzen',
  },
  fr: {
    appName: 'WordEase',
    tagline: 'Mots Mêlés',
    play: 'Jouer',
    dailyPostcard: 'Carte Postale Quotidienne',
    settings: 'Paramètres',
    passport: 'Passeport',
    worldTrip: 'Tour du Monde',
    levelComplete: 'Niveau Terminé !',
    continue: 'Continuer',
    nextLevel: 'Niveau Suivant',
    coins: 'Pièces',
    removeAds: 'Supprimer les Publicités',
    freeCoins: '50 Pièces Gratuites',
    textSize: 'Taille du Texte',
    inputMode: 'Mode de Sélection',
    dragMode: 'Glisser',
    tapMode: 'Taper-Taper',
    soundEffects: 'Effets Sonores',
    music: 'Musique Calme',
    vibration: 'Vibration',
    meanings: 'Significations',
    highContrast: 'Contraste Élevé',
    colorBlind: 'Mode Daltonien',
    reduceMotion: 'Réduire les Animations',
    about: 'À propos et Licences',
    resetProgress: 'Réinitialiser la Progression',
  },
  hi: {
    appName: 'WordEase',
    tagline: 'शब्द खोज पहेली',
    play: 'खेलें',
    dailyPostcard: 'दैनिक पोस्टकार्ड',
    settings: 'सेटिंग्स',
    passport: 'पासपोर्ट',
    worldTrip: 'विश्व यात्रा',
    levelComplete: 'स्तर पूर्ण!',
    continue: 'आगे बढ़ें',
    nextLevel: 'अगला स्तर',
    coins: 'सिक्के',
    removeAds: 'विज्ञापन हटाएं',
    freeCoins: 'मुफ्त 50 सिक्के',
    textSize: 'अक्षर का आकार',
    inputMode: 'खेलने का तरीका',
    dragMode: 'खींचकर चुनें',
    tapMode: 'टैप-टैप',
    soundEffects: 'ध्वनि प्रभाव',
    music: 'शांत संगीत',
    vibration: 'कंपन (वाइब्रेशन)',
    meanings: 'शब्द का अर्थ',
    highContrast: 'उच्च कंट्रास्ट',
    colorBlind: 'कलर-ब्लाइंड फ्रेंडली',
    reduceMotion: 'एनिमेशन कम करें',
    about: 'हमारे बारे में और लाइसेंस',
    resetProgress: 'प्रगति रीसेट करें',
  },
};

export function t(key: TranslationKey, langOverride?: string): string {
  const lang = langOverride ?? useSettings.getState().lang ?? 'en';
  const dict = translations[lang] ?? translations.en;
  return dict[key] ?? translations.en[key] ?? key;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
];
