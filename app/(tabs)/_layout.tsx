import type { Year } from '@/types/year';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import { useFamily } from '@/providers/FamilyProvider';
import { getSessionsByUserAndYear } from '@/utils/sessionutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Tabs, useRouter } from 'expo-router';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const CHART_URL = 'https://chazarahtracker.com/chart';

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
  const { active: user, profiles } = useFamily(); // whoever is being viewed/entered for
  const showSwitcher = profiles.length > 1; // the switcher bar then covers the status bar area
  const router = useRouter();

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
        Alert.alert('Error', 'Failed to load years.');
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
        Alert.alert('Error', 'Failed to load sessions.');
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

  const sessionsCtxValue = useMemo(() => ({ sessions, loading: sessionsLoading, refreshSessions }), [sessions, sessionsLoading, refreshSessions]);

  return (
    <UserContext.Provider value={user}>
      <YearContext.Provider value={selectedYear}>
        <SessionsContext.Provider value={sessionsCtxValue}>
          <View style={{ flex: 1 }}>
            <ProfileSwitcher />
            <Tabs
              screenOptions={({ route }) => ({
                headerStyle: { backgroundColor: '#fff', borderBottomColor: '#e2e8f0', borderBottomWidth: StyleSheet.hairlineWidth, shadowOpacity: 0, elevation: 0 },
                sceneStyle: { backgroundColor: '#f4f6fa' },
                headerStatusBarHeight: showSwitcher ? 0 : undefined,
                tabBarStyle: { borderTopColor: '#e2e8f0' },
                tabBarLabelStyle: { fontWeight: '600' },
                headerTitleAlign: 'left',

                // 🔹 Add picker in header
                headerTitle: () =>
                  loading ? (
                    <ActivityIndicator size="small" />
                  ) : Platform.OS === 'ios' ? (
                    // iOS: compact button → native ActionSheet
                    <TouchableOpacity
                      onPress={() =>
                        ActionSheetIOS.showActionSheetWithOptions(
                          {
                            options: [...years.map((y) => `${y.JewishYear}`), 'Cancel'],
                            cancelButtonIndex: years.length,
                            title: 'Select Year',
                          },
                          (buttonIndex) => {
                            if (buttonIndex < years.length) {
                              setSelectedYear(years[buttonIndex]);
                            }
                          }
                        )
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#0f172a',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 16 }}>
                        {selectedYear?.JewishYear ?? '—'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color="#0f172a" />
                    </TouchableOpacity>
                  ) : (
                    // Android: native dropdown Picker
                    <View
                      style={{
                        backgroundColor: '#ffffffff',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#0f172a',
                        paddingHorizontal: 5,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Picker
                        style={{
                          width: 120,
                          color: '#0f172a',
                          paddingHorizontal: 0,
                          marginHorizontal: 0,
                        }}
                        selectedValue={selectedYear?.JewishYear ?? undefined}
                        onValueChange={(jewishYear: number) => {
                          const found = years.find((y) => y.JewishYear === jewishYear);
                          if (found) setSelectedYear(found);
                        }}
                        dropdownIconColor="#0f172a"
                        mode="dropdown"
                      >
                        {years.map((yearObj) => (
                          <Picker.Item
                            key={yearObj.JewishYear}
                            label={`${yearObj.JewishYear}`}
                            value={yearObj.JewishYear}
                          />
                        ))}
                      </Picker>
                    </View>
                  ),

                // 🔹 Profile icon button
                headerRight: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(CHART_URL).catch(() => Alert.alert('Error', 'Could not open the chart.'))}
                    accessibilityLabel="Open progress chart in browser"
                    style={{ paddingVertical: 6, paddingHorizontal: 6 }}
                  >
                    <Ionicons name="bar-chart-outline" size={26} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/modal/profile')}
                    style={{
                      marginRight: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={28} color="#0f172a" />
                  </TouchableOpacity>
                  </View>
                ),

                // 🔹 Default tab icons restored
                tabBarIcon: ({ color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap;

                  if (route.name === 'chazarah') iconName = 'time-outline';
                  else if (route.name === 'sessions') iconName = 'list-outline';
                  else iconName = 'trophy-outline';

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
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
