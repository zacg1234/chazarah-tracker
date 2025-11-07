import { getUserQuarters } from '@/utils/obligationutil';
import { useFocusEffect } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserContext, YearContext } from './_layout';

export default function ObligationScreen() {
  const user = useContext(UserContext);
  const year = useContext(YearContext);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

    useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoading(true);
        if (user?.id && year) {
          const data = await getUserQuarters(user.id, year);
          if (isActive) setQuarters(data);
        } else {
          if (isActive) setQuarters([]);
        }
        if (isActive) setLoading(false);
      };
      fetchData();
      return () => { isActive = false; };
    }, [user, year])
  );

  // Find the last active quarter
  const lastActiveQuarter = quarters.slice().reverse().find(q => q.isActive);
  const totalOwed = lastActiveQuarter
    ? Math.max(0, Math.round(lastActiveQuarter.MinutesOwed - lastActiveQuarter.MinutesChazered))
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <>
          <Text style={styles.totalOwed}>
            Minutes Owed (Current Quarter): <Text style={styles.owedValue}>{totalOwed}</Text>
          </Text>
          {quarters.map((q, idx) =>
            q.isActive ? (
              <View key={idx} style={styles.quarterBox}>
                <Text style={styles.quarterTitle}>Quarter {idx + 1}</Text>
                <Text style={styles.detail}>Minutes Owed: <Text style={styles.value}>{Math.round(q.MinutesOwed)}</Text></Text>
                <Text style={styles.detail}>Minutes Chazered: <Text style={styles.value}>{Math.round(q.MinutesChazered)}</Text></Text>
                <Text style={styles.detail}>Amount Paid: <Text style={styles.value}>${q.AmountPaid.toFixed(2)}</Text></Text>
              </View>
            ) : null
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 18, color: '#2c3e50', textAlign: 'center' },
  totalOwed: { fontSize: 20, fontWeight: 'bold', color: '#d32f2f', marginBottom: 24, textAlign: 'center' },
  owedValue: { color: '#d32f2f', fontSize: 28 },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 18 },
  quarterBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  quarterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#007bff' },
  detail: { fontSize: 16, marginBottom: 4 },
  value: { fontWeight: 'bold', color: '#2c3e50' },
});
