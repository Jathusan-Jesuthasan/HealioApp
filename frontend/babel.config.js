module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',        // main Expo preset
      'nativewind/babel'          // Tailwind/nativewind support
    ],
    plugins: [
      'react-native-reanimated/plugin',  // 👈 MUST be last
      'react-native-worklets/plugin', // <-- add this line
    ],
  };
};