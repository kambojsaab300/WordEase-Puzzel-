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
