import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import type { Year } from '@/types/year';
import { getSessionsByUserAndYear } from '@/utils/sessionutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';

// ---------- Auth ----------
type AuthCtx = { user: User | null; session: Session | null; loading: boolean; recovery: boolean };
const AuthContext = createContext<AuthCtx>({ user: null, session: null, loading: true, recovery: false });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let mounted = true;
    // A recovery link that lands on any other path (e.g. redirect URL not whitelisted) still goes to the reset page
    if (window.location.hash.includes('type=recovery') && window.location.pathname !== '/reset-password') {
      navigateRef.current('/reset-password' + window.location.hash, { replace: true });
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery link may land on any path; always send the user to the reset page
        setRecovery(true);
        if (window.location.pathname !== '/reset-password') navigateRef.current('/reset-password', { replace: true });
      }
      if (event === 'SIGNED_OUT') setRecovery(false);
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, recovery }),
    [session, loading, recovery]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------- App data (years + sessions), mirrors mobile (tabs)/_layout ----------
type AppData = {
  years: Year[];
  selectedYear: Year | null;
  setSelectedYear: (y: Year) => void;
  sessions: any[];
  sessionsLoading: boolean;
  refreshSessions: () => Promise<void>;
  yearsLoading: boolean;
};
const AppDataContext = createContext<AppData>({
  years: [], selectedYear: null, setSelectedYear: () => {}, sessions: [],
  sessionsLoading: false, refreshSessions: async () => {}, yearsLoading: true,
});
export const useAppData = () => useContext(AppDataContext);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const fetched = await fetchYears();
      setYears(fetched);
      setSelectedYear(getCurrentYear(fetched) ?? fetched[0] ?? null);
      setYearsLoading(false);
    })();
  }, []);

  const refreshSessions = useCallback(async () => {
    if (user?.id && selectedYear?.JewishYear) {
      setSessionsLoading(true);
      try {
        setSessions((await getSessionsByUserAndYear(user.id, selectedYear.JewishYear)) || []);
      } finally {
        setSessionsLoading(false);
      }
    } else {
      setSessions([]);
    }
  }, [user?.id, selectedYear?.JewishYear]);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  const value = useMemo(
    () => ({ years, selectedYear, setSelectedYear, sessions, sessionsLoading, refreshSessions, yearsLoading }),
    [years, selectedYear, sessions, sessionsLoading, refreshSessions, yearsLoading]
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
