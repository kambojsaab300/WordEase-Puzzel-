module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // react-native-* libraries ship untranspiled code
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?)|react-native-)'],
};
