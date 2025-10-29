import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'chazarah-tracker',
  slug: 'chazarah-tracker',
  userInterfaceStyle: 'light',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  }
});