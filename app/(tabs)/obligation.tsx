import { colors, radius, shadow } from '@/constants/theme';
import { formatDateMDY } from '@/utils/dateutil';
import { getUserQuarters } from '@/utils/obligationutil';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SessionsContext, UserContext, YearContext } from './_layout';

export default function ObligationScreen() {
  const user = useContext(UserContext);
  const year = useContext(YearContext);
  const { sessions, refreshSessions } = useContext(SessionsContext);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const result = user?.id && year ? await getUserQuarters(user.id, year, sessions) : [];
          if (active) setQuarters(result);
        } catch (e) {
          console.error('Failed to load obligation', e);
          if (active) setQuarters([]);
        }
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [user, year, sessions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refreshSessions(); } finally { setRefreshing(false); }
  };

  // Current quarter = the last one that has started
  const current = quarters.slice().reverse().find((q) => q.IsActive);
  const owedNow = current ? Math.ceil(current.MinutesOwed - current.MinutesChazered) : 0;
  const caughtUp = owedNow <= 0;
  const tone = caughtUp ? colors.good : colors.bad;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : quarters.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>No obligation was found for you for the selected year.</Text>
        </View>
      ) : (
        <>
          <View style={[styles.hero, { backgroundColor: caughtUp ? colors.goodSoft : colors.badSoft }]}>
            <Text style={[styles.heroLabel, { color: tone }]}>Minutes owed (current quarter)</Text>
            <Text style={[styles.heroValue, { color: tone }]}>{Math.max(owedNow, 0)}</Text>
            <Text style={[styles.heroNote, { color: tone }]}>{caughtUp ? 'You’re all caught up 🎉' : 'Keep going!'}</Text>
            <View style={styles.weeklyPill}>
              <Text style={styles.weeklyText}>Your weekly obligation: <Text style={styles.weeklyValue}>{current?.ObligationPerWeek ?? quarters[0]?.ObligationPerWeek ?? 0} min</Text></Text>
            </View>
          </View>

          {quarters.filter((q) => q.IsActive).map((q) => {
            const pct = q.MinutesOwed > 0 ? Math.min(100, (q.MinutesChazered / q.MinutesOwed) * 100) : 100;
            const finalTone = q.FinalAmountOwed > 0 ? colors.bad : colors.good;
            return (
              <View key={q.QuarterIndex} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.quarterTitle}>Quarter {q.QuarterIndex}</Text>
                  <Text style={styles.quarterDates}>
                    {formatDateMDY(q.QuarterStart)} – {formatDateMDY(q.QuarterEnd)}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: pct >= 100 ? colors.good : colors.primary }]} />
                </View>
                <Row label="Minutes owed" value={`${Math.ceil(q.MinutesOwed)}`} />
                <Row label="Minutes chazered" value={`${Math.floor(q.MinutesChazered)}`} />
                <Row label="Amount paid" value={`$${q.AmountPaid.toFixed(2)}`} />
                {q.FinalAmountOwed !== 0 && (
                  <Row label="Final amount owed" value={`$${q.FinalAmountOwed.toFixed(2)}`} color={finalTone} />
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, color && { color }]}>{label}</Text>
      <Text style={[styles.rowValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14 },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16, padding: 24 },
  hero: { alignItems: 'center', borderRadius: radius, paddingVertical: 22, paddingHorizontal: 16 },
  heroLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  heroValue: { fontSize: 52, fontWeight: '800', marginVertical: 2 },
  heroNote: { fontSize: 14 },
  weeklyPill: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  weeklyText: { fontSize: 14, color: colors.muted },
  weeklyValue: { fontWeight: '700', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 16, ...shadow },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  quarterTitle: { fontSize: 18, fontWeight: '700', color: colors.primary },
  quarterDates: { fontSize: 13, color: colors.muted, flexShrink: 1, textAlign: 'right' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden', marginBottom: 12 },
  fill: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowLabel: { fontSize: 15, color: colors.muted },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
