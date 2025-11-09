import { formatDateMDY } from '@/utils/dateutil';
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
      let IsActive = true;
      const fetchData = async () => {
        setLoading(true);
        if (user?.id && year) {
          const data = await getUserQuarters(user.id, year);
          if (IsActive) setQuarters(data);
        } else {
          if (IsActive) setQuarters([]);
        }
        if (IsActive) setLoading(false);
      };
      fetchData();
      return () => { IsActive = false; };
    }, [user, year])
  );

  // Find the last active quarter
  const lastActiveQuarter = quarters.slice().reverse().find(q => q.IsActive);
  const totalOwed = lastActiveQuarter
    ? Math.round(lastActiveQuarter.MinutesOwed - lastActiveQuarter.MinutesChazered): 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <>
        <View style={styles.owedBox}>
          <Text style={[styles.owedTitle, { color: totalOwed > 0 ? '#d32f2f' : '#388e3c' }]}>Minutes Owed (Current Quarter)</Text>
          <Text style={[styles.owedValue, { color: totalOwed > 0 ? '#d32f2f' : '#388e3c' }]}>{totalOwed}</Text>
        </View>
          {quarters.map((q, idx) =>
            q.IsActive ? (
              <View key={idx} style={styles.quarterBox}>
                <View style={styles.quarterHeaderRow}>
                  <Text style={styles.quarterTitle}>Quarter {q.QuarterIndex}</Text>
                  <Text style={styles.quarterDates}>
                    ({formatDateMDY(q.QuarterStart)}   -   {formatDateMDY(q.QuarterEnd)})
                  </Text>
                </View>
                <Text style={styles.detail}>Minutes Owed: <Text style={styles.value}>{Math.round(q.MinutesOwed)}</Text></Text>
                <Text style={styles.detail}>Minutes Chazered: <Text style={styles.value}>{Math.round(q.MinutesChazered)}</Text></Text>
                <Text style={styles.detail}>Amount Paid: <Text style={styles.value}>${q.AmountPaid.toFixed(2)}</Text></Text>
                {q.FinalAmountOwed !== 0 && (
                  <Text style={[styles.detail, { color: q.FinalAmountOwed > 0 ? '#d32f2f' : '#388e3c' }]}> 
                    Final Amount Owed: <Text style={[styles.value, { color: q.FinalAmountOwed > 0 ? '#d32f2f' : '#388e3c' }]}>${q.FinalAmountOwed.toFixed(2)}</Text>
                  </Text>
                )}        
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
  owedBox: { alignItems: 'center', marginBottom: 24 },
  owedTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  owedValue: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
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
  quarterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quarterDates: {
    fontSize: 13,
    fontWeight: '400',
    color: '#222',
    marginBottom: 6,
    textAlign: 'right',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});
