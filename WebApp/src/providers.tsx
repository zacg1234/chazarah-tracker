import type { User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import type { Year } from '@/types/year';
import { getSessionsByUserAndYear } from '@/utils/sessionutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';
import { getFamilyProfiles, type Profile } from '@/utils/profileutil';

// ---------- Auth ----------
type AuthCtx = { user: User | null; loading: boolean; recovery: boolean };
const AuthContext = createContext<AuthCtx>({ user: null, loading: true, recovery: false });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setUser(newSession?.user ?? null);
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

  const value = useMemo(() => ({ user, loading, recovery }), [user, loading, recovery]);
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
  // Family profiles: whose minutes are being viewed/entered (the logged-in user or a sub-account)
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (id: string) => void;
  reloadProfiles: () => Promise<void>;
};
const AppDataContext = createContext<AppData>({
  years: [], selectedYear: null, setSelectedYear: () => {}, sessions: [],
  sessionsLoading: false, refreshSessions: async () => {}, yearsLoading: true,
  profiles: [], activeProfile: null, setActiveProfile: () => {}, reloadProfiles: async () => {},
});
export const useAppData = () => useContext(AppDataContext);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeKey = user ? `active_profile_${user.id}` : '';

  const reloadProfiles = useCallback(async () => {
    if (!user) return;
    const list = await getFamilyProfiles(user);
    setProfiles(list);
    let saved: string | null = null;
    try { saved = localStorage.getItem(activeKey); } catch { /* use default */ }
    setActiveId((current) => {
      const wanted = current ?? saved;
      return list.some((p) => p.id === wanted) ? wanted : user.id;
    });
  }, [user, activeKey]);

  // Keyed on the user id: auth refreshes hand us a new user object every hour
  useEffect(() => {
    reloadProfiles().catch((e) => console.error('Failed to load profiles', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setActiveProfile = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(activeKey, id); } catch { /* ignore */ }
  }, [activeKey]);

  const activeProfile = useMemo(() => profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null, [profiles, activeId]);

  useEffect(() => {
    (async () => {
      const fetched = await fetchYears();
      setYears(fetched);
      setSelectedYear(getCurrentYear(fetched) ?? fetched[0] ?? null);
      setYearsLoading(false);
    })();
  }, []);

  // Only the latest request may write: a slow response for a previous profile/year must not overwrite newer data
  const latestRequest = useRef(0);
  const refreshSessions = useCallback(async () => {
    const requestId = ++latestRequest.current;
    if (activeProfile?.id && selectedYear?.JewishYear) {
      setSessionsLoading(true);
      try {
        const data = (await getSessionsByUserAndYear(activeProfile.id, selectedYear.JewishYear)) || [];
        if (requestId === latestRequest.current) setSessions(data);
      } finally {
        if (requestId === latestRequest.current) setSessionsLoading(false);
      }
    } else {
      setSessions([]);
    }
  }, [activeProfile?.id, selectedYear?.JewishYear]);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  const value = useMemo(
    () => ({ years, selectedYear, setSelectedYear, sessions, sessionsLoading, refreshSessions, yearsLoading, profiles, activeProfile, setActiveProfile, reloadProfiles }),
    [years, selectedYear, sessions, sessionsLoading, refreshSessions, yearsLoading, profiles, activeProfile, setActiveProfile, reloadProfiles]
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
