import { supabase } from '@/services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  recovery: boolean; // true while the user is resetting their password from an emailed link
  recoveryError: string | null; // set when the reset link was invalid or expired
  endRecovery: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, recovery: false, recoveryError: null, endRecovery: async () => { },
});

// Password-reset emails redirect to chazarahtracker://reset-password#access_token=...&refresh_token=...&type=recovery
function parseRecoveryUrl(url: string | null) {
  if (!url || !url.includes('reset-password')) return null;
  const fragment = url.split('#')[1] ?? url.split('?')[1] ?? '';
  const params = new URLSearchParams(fragment);
  const errorDescription = params.get('error_description');
  if (errorDescription) return { error: errorDescription.replace(/\+/g, ' ') };
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (params.get('type') === 'recovery' && accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const handledUrl = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          // e.g. a saved session whose refresh token is no longer valid: drop it and show login
          await supabase.auth.signOut({ scope: 'local' }).catch(() => { });
        }
        if (!mounted) return;
        setSession(error ? null : data.session ?? null);
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT') setRecovery(false);
    });

    // Handle the reset-password deep link (cold start and while the app is open)
    const handleUrl = async (url: string | null) => {
      const parsed = parseRecoveryUrl(url);
      if (!parsed || url === handledUrl.current) return;
      handledUrl.current = url;
      if ('error' in parsed) {
        setRecoveryError(parsed.error ?? 'This reset link is invalid or has expired.');
        return;
      }
      setRecoveryError(null);
      setRecovery(true); // before the session exists, so the app shows the reset screen, not the tabs
      const { error } = await supabase.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: parsed.refreshToken,
      });
      if (error) {
        setRecovery(false);
        setRecoveryError(error.message);
      }
    };
    Linking.getInitialURL().then(handleUrl).catch(() => { });
    const linkSub = Linking.addEventListener('url', ({ url }) => { handleUrl(url); });

    return () => {
      sub.subscription.unsubscribe();
      linkSub.remove();
      mounted = false;
    };
  }, []);

  // Leave recovery mode by signing out, so the user logs in fresh with the new password
  const user = session?.user ?? null;

  const endRecovery = async () => {
    await supabase.auth.signOut().catch(() => { });
    setRecovery(false);
    setRecoveryError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, recovery, recoveryError, endRecovery }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
