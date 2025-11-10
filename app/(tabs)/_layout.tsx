import type { Year } from '@/types/year';
import { getLoggedInUser } from '@/utils/authutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Tabs, useRouter } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';


export const YearContext = createContext<Year | null>(null);
export const UserContext = createContext<any>(null);


export default function TabsLayout() {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [loading, setLoading] = useState(true);
  //const [showPicker, setShowPicker] = useState(false);
  const [user, setUser] = useState<any>();
  const router = useRouter();

  // 🔹 Fetch years from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedYears = await fetchYears();
      setYears(fetchedYears);
      const defaultYear = getCurrentYear(fetchedYears);
      setSelectedYear(defaultYear ?? fetchedYears[0] ?? null);
      const userObj = await getLoggedInUser();
      setUser(userObj);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <UserContext.Provider value={user}>
    <YearContext.Provider value={selectedYear}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#fff' },
            headerTitleAlign: 'left',

            // 🔹 Add picker in header
            headerTitle: () =>
              loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <View
      style={{
        backgroundColor: '#FFFF', // match tab bg
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2c3e50',
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
                <Picker
                  style={{
                    width: 110,
                  }}
                  selectedValue={selectedYear ?? undefined}
                  onValueChange={(yearObj: Year) => {
                    setSelectedYear(yearObj);
                  }}
                  dropdownIconColor="#2c3e50"
                  mode="dropdown"
                >
                  {years.map((yearObj) => (
                    <Picker.Item
                      key={yearObj.JewishYear}
                      label={`${yearObj.JewishYear}`}
                      value={yearObj}
                    />
                  ))}
                </Picker>
                </View>
              ),

            // 🔹 Profile icon button
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/modal/profile')}
                style={{
                  marginRight: 10,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Ionicons name="person-circle-outline" size={28} color="#2c3e50" />
              </TouchableOpacity>
            ),

            // 🔹 Default tab icons restored
            tabBarIcon: ({ color, size }) => {
              var iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'chazarah') iconName = 'time-outline';
              else if (route.name === 'sessions') iconName = 'list-outline';
              else iconName = 'trophy-outline';

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2c3e50',
            tabBarInactiveTintColor: '#95a5a6',
          })}
        >
          <Tabs.Screen name="chazarah" options={{ title: 'Chazarah' }} />
          <Tabs.Screen name="sessions" options={{ title: 'Sessions' }} />
          <Tabs.Screen name="obligation" options={{ title: 'Obligation' }} />
        </Tabs>
      </View>
    </YearContext.Provider>
    </UserContext.Provider>
  );
}
