/* global jest */
// MMKV is a native module; tests use an in-memory stand-in with the same API
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const data = new Map();
    return {
      set: (key, value) => data.set(key, value),
      getString: key => data.get(key),
      remove: key => data.delete(key),
      getAllKeys: () => [...data.keys()],
      clearAll: () => data.clear(),
    };
  },
}));

jest.mock('sp-react-native-in-app-updates', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: false }),
      startUpdate: jest.fn().mockResolvedValue(undefined),
      addStatusUpdateListener: jest.fn(),
      removeStatusUpdateListener: jest.fn(),
    })),
    IAUUpdateKind: {
      FLEXIBLE: 0,
      IMMEDIATE: 1,
    },
    IAUAvailabilityStatus: {
      UNKNOWN: 0,
      UNAVAILABLE: 1,
      AVAILABLE: 2,
    },
    IAUInstallStatus: {
      UNKNOWN: 0,
      PENDING: 1,
      DOWNLOADING: 2,
      INSTALLING: 3,
      INSTALLED: 4,
      FAILED: 5,
      CANCELED: 6,
      DOWNLOADED: 11,
    },
  };
});

// AdMob is native; ads never load in tests, so every show reports "unavailable"
jest.mock('react-native-google-mobile-ads', () => {
  const fakeAd = () => ({
    addAdEventListener: jest.fn(() => jest.fn()),
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
  });
  return {
    __esModule: true,
    default: () => ({
      initialize: jest.fn(() => Promise.resolve([])),
      setRequestConfiguration: jest.fn(() => Promise.resolve()),
    }),
    AdsConsent: {
      gatherConsent: jest.fn(() => Promise.resolve({ canRequestAds: true })),
      showPrivacyOptionsForm: jest.fn(() => Promise.resolve()),
    },
    InterstitialAd: { createForAdRequest: jest.fn(fakeAd) },
    RewardedAd: { createForAdRequest: jest.fn(fakeAd) },
    AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
    RewardedAdEventType: { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' },
    MaxAdContentRating: { G: 'G' },
    TestIds: { INTERSTITIAL: 'test-interstitial', REWARDED: 'test-rewarded', BANNER: 'test-banner' },
  };
});

// Firebase is native; with no app configured the sink must stay silent
jest.mock('@react-native-firebase/app', () => ({ getApps: jest.fn(() => []) }));
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
}));
