import { Ionicons } from '@expo/vector-icons'; // 👈 For icons
import { Picker } from '@react-native-picker/picker';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../services/supabaseClient'; // adjust if needed

export default function TabsLayout() {
  const [years, setYears] = useState<{ JewishYear: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();

  // 🔹 Fetch years from Supabase
  useEffect(() => {
    const fetchYears = async () => {
      const { data, error } = await supabase
        .from('TblYear')
        .select('JewishYear')
        .order('JewishYear', { ascending: false });

      if (!error && data) {
        setYears(data);
        setSelectedYear(data[0]?.JewishYear ?? null);
      }
      setLoading(false);
    };
    fetchYears();
  }, []);

  // 🔹 Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
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
              <TouchableOpacity onPress={() => setShowPicker(!showPicker)}>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>
                  {selectedYear ?? 'Select a Year'} ▼
                </Text>
              </TouchableOpacity>
            ),

          // 🔹 Logout button
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                marginRight: 10,
                backgroundColor: '#e74c3c',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          ),

          // 🔹 Default tab icons restored
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

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

      {/* 🔹 Year Picker dropdown */}
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
                value={y.JewishYear}
              />
            ))}
          </Picker>
        </View>
      )}
    </View>
  );
}
