import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'supabase-session',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // handles the password-recovery link
    },
  }
);
