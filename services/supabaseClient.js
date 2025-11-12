// utils/supabaseClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';


const supabaseUrl = Constants.expoConfig.extra.supabaseUrl
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'supabase-session', // any name you want
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // enable handling of OAuth redirects + consistency on web
  },
});
