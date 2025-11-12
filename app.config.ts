import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'Chazarah Tracker',
  slug: 'chazarah-tracker',
  owner: 'zacg1234',
  scheme: 'chazarahtracker',
  userInterfaceStyle: 'light',
  icon: './assets/images/Chazarah_Tracker_Logo.png',
  ios: {
    ...(config.ios || {}),
    bundleIdentifier: 'com.zacg1234.chazarahtracker',
    supportsTablet: true,
  },
  android: {
    ...(config.android || {}),
    package: 'com.zacg1234.chazarahtracker',
    adaptiveIcon: {
      foregroundImage: './assets/images/Chazarah_Tracker_Logo.png'
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...(config.web || {}),
    output: 'static',
    favicon: './assets/images/Chazarah_Tracker_Favicon.png',
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
        image: './assets/images/Chazarah_Tracker_Logo.png',
        resizeMode: 'contain'
      },
    ],
  ],
});