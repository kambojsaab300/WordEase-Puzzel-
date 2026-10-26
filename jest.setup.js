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
