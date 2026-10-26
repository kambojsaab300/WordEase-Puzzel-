module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must stay last (Reanimated 4 guide)
  plugins: ['react-native-worklets/plugin'],
};
