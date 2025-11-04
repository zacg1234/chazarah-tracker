import type { Year } from '@/types/year';
import { getLoggedInUser, handleLogout } from '@/utils/authutil';
import { fetchYears, getCurrentYear } from '@/utils/yearutils';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Tabs, useRouter } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';


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

            // 🔹 Logout button
            headerRight: () => (
              <TouchableOpacity
                onPress={() => handleLogout(router)}
                style={{
                  marginRight: 10,
                  //backgroundColor: '#e74c3c',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Logout</Text>
              </TouchableOpacity>
            ),

            // 🔹 Default tab icons restored
            tabBarIcon: ({ color, size }) => {
              var iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'chazarah') iconName = 'time-outline';
              else if (route.name === 'sessions') iconName = 'list-outline';
              else iconName = 'person-outline';

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2c3e50',
            tabBarInactiveTintColor: '#95a5a6',
          })}
        >
          <Tabs.Screen name="chazarah" options={{ title: 'Chazarah' }} />
          <Tabs.Screen name="sessions" options={{ title: 'Sessions' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>

        {/* 🔹 Year Picker dropdown
      {showPicker && (
        <View
          style={{
            position: 'absolute',
            top: 65,
            left: 10,
            right: 10,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <Picker
            selectedValue={selectedYear}
            onValueChange={(val) => {
              setSelectedYear(val);
              setShowPicker(false);
            }}
          >
            {years.map((y) => (
              <Picker.Item
                key={y.JewishYear}
                label={`${y.JewishYear}`}
                value={y}
              />
            ))}
          </Picker>
        </View>
      )} */}
      </View>
    </YearContext.Provider>
    </UserContext.Provider>
  );
}
