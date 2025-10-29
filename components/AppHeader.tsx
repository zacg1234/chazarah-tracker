import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabaseClient';

export default function AppHeader() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [years, setYears] = useState<number[]>([]);

  // Load available Jewish years from your Supabase table
  useEffect(() => {
    const loadYears = async () => {
      const { data, error } = await supabase.from('TblYear').select('JewishYear');
      if (!error && data) {
        const sortedYears = data.map(y => y.JewishYear).sort((a, b) => b - a);
        setYears(sortedYears);
        if (sortedYears.length > 0) setSelectedYear(sortedYears[0]);
      }
    };
    loadYears();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.header}>
      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={selectedYear}
          style={styles.picker}
          onValueChange={(value) => setSelectedYear(value)}
        >
          {years.map((year) => (
            <Picker.Item key={year} label={`${year}`} value={year} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dropdownContainer: {
    flex: 1,
    maxWidth: 140,
  },
  picker: {
    color: 'white',
    height: 40,
    width: '100%',
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '600',
  },
});
