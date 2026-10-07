import { colors } from '@/constants/theme';
import { useFamily } from '@/providers/FamilyProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Bar under the header showing whose minutes are being viewed/entered. Turns amber
// when that is not the logged-in user so entries never go to the wrong person.
export default function ProfileSwitcher() {
  const { profiles, active, setActive } = useFamily();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  if (profiles.length < 2 || !active) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.bar, !active.isSelf && styles.barOther, { paddingTop: insets.top + 8 }]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Switch profile"
      >
        <Ionicons name={active.isSelf ? 'person-outline' : 'people-outline'} size={16} color={active.isSelf ? colors.muted : '#92400e'} />
        <Text style={[styles.barText, !active.isSelf && styles.barTextOther]} numberOfLines={1}>
          {active.isSelf ? active.name : `Entering for ${active.name}`}
        </Text>
        <Text style={[styles.switch, !active.isSelf && styles.barTextOther]}>Switch ▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => { }}>
            <Text style={styles.title}>Who are you entering for?</Text>
            {profiles.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.item, p.id === active.id && styles.itemActive]}
                onPress={() => { setActive(p.id); setOpen(false); }}
              >
                <Text style={styles.itemText}>{p.name}{p.isSelf ? ' (me)' : ''}</Text>
                {p.id === active.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => { setOpen(false); router.push('/modal/profile'); }}>
              <Text style={styles.manage}>Manage family profiles</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line,
  },
  barOther: { backgroundColor: '#fffbeb', borderBottomColor: '#fde68a' },
  barText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.muted },
  barTextOther: { color: '#92400e' },
  switch: { fontSize: 13, fontWeight: '600', color: colors.primary },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'center', alignItems: 'center' },
  sheet: { width: 320, backgroundColor: colors.card, borderRadius: 14, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.ink },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  itemActive: { backgroundColor: colors.primarySoft },
  itemText: { fontSize: 16, color: colors.ink },
  manage: { marginTop: 14, textAlign: 'center', color: colors.primary, fontWeight: '600' },
});
