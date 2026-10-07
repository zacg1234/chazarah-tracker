// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'WebApp/**', 'modules/**/build/**', 'targets/**'],
  },
  {
    // Text/TextInput must come from our wrappers so every screen gets the app font
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react-native',
          importNames: ['Text', 'TextInput'],
          message: "Import Text/TextInput from '@/components/Text' so the app font is applied.",
        }],
      }],
    },
  },
]);
