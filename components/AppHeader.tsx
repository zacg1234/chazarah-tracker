import IconButton from '@/components/IconButton';
import { Text } from '@/components/Text';
import { showAlert } from '@/components/Dialog';
import { colors, radii, space } from '@/constants/theme';
import { useFamily } from '@/providers/FamilyProvider';
import type { Year } from '@/types/year';
import { Ionicons } from '@expo/vector-icons';
import { tap } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHART_URL = 'https://chazarahtracker.com/chart';

type Props = { years: Year[]; selectedYear: Year | null; onSelectYear: (y: Year) => void; loading: boolean };

// One compact bar: year · who you're entering for · chart · profile. When entering for someone other
// than yourself the whole bar turns amber so minutes never go to the wrong person by accident.
export default function AppHeader({ years, selectedYear, onSelectYear, loading }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profiles, active, setActive } = useFamily();
  const [sheet, setSheet] = useState<'year' | 'profile' | null>(null);
  const other = !!active && !active.isSelf;
  const showProfile = profiles.length > 1 && !!active;

  return (
    <>
      <View style={[styles.bar, { paddingTop: insets.top + space.sm }, other && styles.barOther]}>
        {loading ? (
          <ActivityIndicator size="small" style={{ marginHorizontal: space.lg }} />
        ) : (
          <Pressable
            onPress={() => { tap(); setSheet('year'); }}
            style={({ pressed }) => [styles.yearPill, pressed && styles.pressed]}
            accessibilityLabel="Select year"
          >
            <Text style={styles.yearText}>{selectedYear?.JewishYear ?? '—'}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.ink} />
          </Pressable>
        )}

        {showProfile ? (
          <Pressable
            onPress={() => { tap(); setSheet('profile'); }}
            style={({ pressed }) => [styles.profileChip, other && styles.profileChipOther, pressed && styles.pressed]}
            accessibilityLabel="Switch profile"
          >
            <Ionicons name={other ? 'people' : 'person'} size={14} color={other ? colors.warn : colors.muted} />
            <Text style={[styles.profileText, other && { color: colors.warn }]} numberOfLines={1}>
              {other ? `For ${active!.name}` : active!.name}
            </Text>
            <Ionicons name="chevron-down" size={12} color={other ? colors.warn : colors.muted} />
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <View style={styles.actions}>
          <IconButton size={36} icon="stats-chart-outline" label="Open progress chart in browser" onPress={() => Linking.openURL(CHART_URL).catch(() => showAlert('Error', 'Could not open the chart.'))} />
          <IconButton size={36} icon="person-outline" label="Profile" onPress={() => router.push('/modal/profile')} />
        </View>
      </View>

      <BottomSheet visible={sheet === 'year'} title="Select year" onClose={() => setSheet(null)}>
        {years.map((y) => (
          <SheetRow key={y.JewishYear} label={`${y.JewishYear}`} selected={y.JewishYear === selectedYear?.JewishYear}
            onPress={() => { tap(); onSelectYear(y); setSheet(null); }} />
        ))}
      </BottomSheet>

      <BottomSheet visible={sheet === 'profile'} title="Who are you entering for?" onClose={() => setSheet(null)}>
        {profiles.map((p) => (
          <SheetRow key={p.id} label={`${p.name}${p.isSelf ? ' (me)' : ''}`} selected={p.id === active?.id}
            onPress={() => { tap(); setActive(p.id); setSheet(null); }} />
        ))}
        <Pressable onPress={() => { setSheet(null); router.push('/modal/profile'); }} style={({ pressed }) => [styles.manage, pressed && styles.pressed]}>
          <Text style={styles.manageText}>Manage family profiles</Text>
        </Pressable>
      </BottomSheet>
    </>
  );
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]} onPress={() => { }}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {/* long lists (many years / profiles) scroll instead of running off the screen */}
          <ScrollView style={{ maxHeight: height * 0.6 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
      <Text style={[styles.rowText, selected && { color: colors.primary, fontWeight: '600' }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm,
    backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line,
  },
  barOther: { backgroundColor: colors.warnBar, borderBottomColor: colors.warnLine },
  pressed: { opacity: 0.6 },
  yearPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14,
    borderRadius: radii.pill, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: '#bfd0fb',
  },
  yearText: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: 0.2 },
  profileChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12,
    borderRadius: radii.pill, backgroundColor: colors.soft, borderWidth: 1.5, borderColor: colors.line,
  },
  profileChipOther: { backgroundColor: colors.warnSoft, borderColor: colors.warnLine },
  profileText: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.muted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: space.lg, paddingTop: space.sm },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.inputBorder, marginBottom: space.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: space.sm, paddingHorizontal: space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: space.md, borderRadius: radii.sm },
  rowSelected: { backgroundColor: colors.primarySoft },
  rowText: { fontSize: 17, color: colors.ink },
  manage: { marginTop: space.md, alignItems: 'center', paddingVertical: space.sm },
  manageText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
