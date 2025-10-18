module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@assets': './src/assets',
            '@components': './src/components',
            '@config': './src/config',
            '@context': './src/context',
            '@hooks': './src/hooks',
            '@lang': './src/lang',
            '@models': './src/models',
            '@navigation': './src/navigation',
            '@redux': './src/redux',
            '@screens': './src/screens',
            '@styles': './src/styles',
            '@typings': './src/typings',
            '@utils': './src/utils'
          }
        }
      ],
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin'
    ]
  };
};
