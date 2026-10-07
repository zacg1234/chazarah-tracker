import { colors, radii, softShadow, space } from '@/constants/theme';
import { formatDateMDY } from '@/utils/dateutil';
import { getObligationData, getUserQuarters, type ObligationData } from '@/utils/obligationutil';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { SessionsContext, UserContext, YearContext } from './_layout';

export default function ObligationScreen() {
  const user = useContext(UserContext);
  const year = useContext(YearContext);
  const { sessions, refreshSessions } = useContext(SessionsContext);
  const [data, setData] = useState<ObligationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedFor = useRef('');
  const [reloadTick, setReloadTick] = useState(0); // pull-to-refresh also refetches payments

  // Obligation and payments are refetched on focus (payments can change elsewhere), but not when only the
  // sessions change: the totals are recomputed from them below
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const key = `${user?.id}:${year?.JewishYear}`;
      (async () => {
        if (loadedFor.current !== key) setLoading(true); // no loader flash when just coming back to the tab
        try {
          const result = user?.id && year ? await getObligationData(user.id, year) : null;
          if (active) { setData(result); loadedFor.current = key; }
        } catch (e) {
          console.error('Failed to load obligation', e);
          if (active) setData(null);
        }
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [user, year, reloadTick])
  );

  const quarters = useMemo(() => getUserQuarters(data, sessions), [data, sessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    setReloadTick((n) => n + 1);
    try { await refreshSessions(); } finally { setRefreshing(false); }
  };

  // Current quarter = the last one that has started
  const started = quarters.filter((q) => q.IsActive);
  const current = started[started.length - 1];
  const owedNow = current ? Math.ceil(current.MinutesOwed - current.MinutesChazered) : 0;
  const caughtUp = owedNow <= 0;
  const ahead = Math.max(-owedNow, 0); // surplus minutes beyond what's owed so far
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
            <Text style={[styles.heroLabel, { color: tone }]}>{ahead > 0 ? 'Minutes ahead' : 'Minutes owed'} (current quarter)</Text>
            <Text style={[styles.heroValue, { color: tone }]}>{ahead > 0 ? ahead : Math.max(owedNow, 0)}</Text>
            <Text style={[styles.heroNote, { color: tone }]}>{!caughtUp ? 'Keep going!' : ahead > 0 ? 'You’re ahead of your obligation 🎉' : 'You’re all caught up 🎉'}</Text>
            <View style={styles.weeklyPill}>
              <Text style={styles.weeklyText}>Your weekly obligation: <Text style={styles.weeklyValue}>{current?.ObligationPerWeek ?? quarters[0]?.ObligationPerWeek ?? 0} min</Text></Text>
            </View>
          </View>

          {started.map((q) => {
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
  content: { padding: space.lg, gap: space.lg },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16, padding: space.xl },
  hero: { alignItems: 'center', borderRadius: radii.lg, paddingVertical: space.xl, paddingHorizontal: space.lg },
  heroLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3, textTransform: 'uppercase' },
  heroValue: { fontSize: 64, fontWeight: '800', marginTop: space.xs, letterSpacing: -1 },
  heroNote: { fontSize: 15, fontWeight: '500', marginBottom: space.xs },
  weeklyPill: { marginTop: space.md, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 16 },
  weeklyText: { fontSize: 14, color: colors.muted },
  weeklyValue: { fontWeight: '700', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: space.lg + 4, ...softShadow },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md },
  quarterTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  quarterDates: { fontSize: 13, color: colors.muted, flexShrink: 1, textAlign: 'right' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.line, overflow: 'hidden', marginBottom: space.lg },
  fill: { height: '100%', borderRadius: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  rowLabel: { fontSize: 15, color: colors.muted },
  rowValue: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
