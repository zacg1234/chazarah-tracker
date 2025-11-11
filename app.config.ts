import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'chazarah-tracker',
  slug: 'chazarah-tracker',
  owner: 'zacg1234',
  scheme: 'chazarahtracker',
  userInterfaceStyle: 'light',
  icon: './assets/images/AALogoSmall.png',
  ios: {
    ...(config.ios || {}),
    bundleIdentifier: 'com.zacg1234.chazarahtracker',
    supportsTablet: true,
  },
  android: {
    ...(config.android || {}),
    package: 'com.zacg1234.chazarahtracker',
    adaptiveIcon: {
      foregroundImage: './assets/images/AALogoSmall.png',
      backgroundColor: '#FFFFFF',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...(config.web || {}),
    output: 'static',
    favicon: './assets/images/AALogoSmall.png',
  },
  extra: {
    ...(config.extra || {}),
    router: {},
    eas: {
      projectId: '70d8dbbd-2779-473f-86d5-f8a8ed1bed33',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        image: './assets/images/AALogoSmall.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],
});