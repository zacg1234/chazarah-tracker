import type { Year } from '@/types/year';
import { showAlert } from '@/components/Dialog';
import AppHeader from '@/components/AppHeader';
import { HapticTab } from '@/components/haptic-tab';
import { colors, fontFamilies } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useFamily } from '@/providers/FamilyProvider';
import { useOfflineSync } from '@/utils/useOfflineSync';
import { getSessionsByUserAndYear } from '@/utils/sessionutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const YearContext = createContext<Year | null>(null);
export const UserContext = createContext<any>(null);
export const SessionsContext = createContext<{ sessions: any[]; loading: boolean; refreshSessions: () => Promise<void>; }>({ sessions: [], loading: false, refreshSessions: async () => { } });


export default function TabsLayout() {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  //const [showPicker, setShowPicker] = useState(false);
  const { active: user } = useFamily(); // whoever is being viewed/entered for
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth(); // the logged-in account (sub-profiles queue under it)

  // 🔹 Fetch years from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedYears = await fetchYears();
        setYears(fetchedYears);
        const defaultYear = getCurrentYear(fetchedYears);
        setSelectedYear(defaultYear ?? fetchedYears[0] ?? null);
      } catch (error) {
        showAlert('Error', 'Failed to load years.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshSessions = useCallback(async () => {
    if (user?.id && selectedYear?.JewishYear) {
      setSessionsLoading(true);
      try {
        const data = await getSessionsByUserAndYear(user.id, selectedYear.JewishYear);
        setSessions(data || []);
      } catch (e) {
        console.error('Failed to load sessions', e);
        showAlert('Error', 'Failed to load sessions.');
      } finally {
        setSessionsLoading(false);
      }
    } else {
      setSessions([]);
    }
  }, [user?.id, selectedYear?.JewishYear]);

  // Fetch sessions on app open and whenever user/year changes
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useOfflineSync(authUser?.id, refreshSessions);

  const sessionsCtxValue = useMemo(() => ({ sessions, loading: sessionsLoading, refreshSessions }), [sessions, sessionsLoading, refreshSessions]);

  return (
    <UserContext.Provider value={user}>
      <YearContext.Provider value={selectedYear}>
        <SessionsContext.Provider value={sessionsCtxValue}>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <AppHeader years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} loading={loading} />
            <Tabs
              screenOptions={({ route }) => ({
                headerShown: false,
                sceneStyle: { backgroundColor: colors.bg },
                tabBarButton: HapticTab,
                tabBarStyle: {
                  backgroundColor: colors.card,
                  borderTopColor: colors.line,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  elevation: 0,
                  height: (Platform.OS === 'android' ? 64 : 54) + insets.bottom,
                  paddingTop: 6,
                },
                tabBarLabelStyle: { fontFamily: fontFamilies['600'], fontSize: 11, letterSpacing: 0.2 },
                tabBarIcon: ({ color, size, focused }) => {
                  const base = route.name === 'chazarah' ? 'hourglass' : route.name === 'sessions' ? 'list' : 'trophy';
                  return <Ionicons name={(focused ? base : `${base}-outline`) as keyof typeof Ionicons.glyphMap} size={size + 1} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.placeholder,
              })}
            >
              <Tabs.Screen name="chazarah" options={{ title: 'Chazarah' }} />
              <Tabs.Screen name="sessions" options={{ title: 'Sessions' }} />
              <Tabs.Screen name="obligation" options={{ title: 'Obligation' }} />
            </Tabs>
          </View>
        </SessionsContext.Provider>
      </YearContext.Provider>
    </UserContext.Provider>
  );
}
