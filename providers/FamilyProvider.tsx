import { useAuth } from '@/providers/AuthProvider';
import { getFamilyProfiles, type Profile } from '@/utils/profileutil';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type FamilyContextType = {
  profiles: Profile[];
  active: Profile | null; // whose minutes the app is showing/entering
  setActive: (id: string) => void;
  reload: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextType>({
  profiles: [], active: null, setActive: () => { }, reload: async () => { },
});

const storageKey = (ownerId: string) => `active_profile_${ownerId}`;

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setActiveId(null);
      return;
    }
    const [list, saved] = await Promise.all([
      getFamilyProfiles(user),
      AsyncStorage.getItem(storageKey(user.id)).catch(() => null),
    ]);
    setProfiles(list);
    setActiveId((current) => {
      const wanted = current ?? saved;
      return list.some((p) => p.id === wanted) ? wanted : user.id;
    });
  }, [user]);

  // Keyed on the user id: auth refreshes hand us a new user object every hour
  useEffect(() => {
    reload().catch((e) => console.error('Failed to load profiles', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    if (user) AsyncStorage.setItem(storageKey(user.id), id).catch(() => { });
  }, [user]);

  const active = useMemo(() => profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null, [profiles, activeId]);
  const value = useMemo(() => ({ profiles, active, setActive, reload }), [profiles, active, setActive, reload]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

export const useFamily = () => useContext(FamilyContext);
