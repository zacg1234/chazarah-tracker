import Button from '@/components/Button';
import { Text } from '@/components/Text';
import { colors, space } from '@/constants/theme';
import { warn } from '@/utils/haptics';
import { noOrphan } from '@/utils/text';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

export type DialogButton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
type DialogRequest = { title: string; message?: string; buttons: DialogButton[] };

// Drop-in replacement for Alert.alert(title, message, buttons): same arguments, but themed.
let listener: ((r: DialogRequest) => void) | null = null;
const queue: DialogRequest[] = [];

export function showAlert(title: string, message?: string, buttons?: DialogButton[]) {
  const request = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  if (listener) listener(request);
  else queue.push(request);
}

// Mounted once at the root
export function DialogHost() {
  const [current, setCurrent] = useState<DialogRequest | null>(null);
  const currentRef = useRef<DialogRequest | null>(null); // the source of truth: timers fire before React re-renders
  const pending = useRef<DialogRequest[]>([]);
  const scale = useRef(new Animated.Value(0.92)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const present = (r: DialogRequest) => {
    if (currentRef.current) { pending.current.push(r); return; }
    currentRef.current = r;
    scale.setValue(0.92); fade.setValue(0);
    setCurrent(r);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 }),
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    if (r.buttons.some((b) => b.style === 'destructive')) warn();
  };
  const presentRef = useRef(present);
  presentRef.current = present;

  useEffect(() => {
    // small delay so a modal that is closing right now can finish before the dialog opens on top
    listener = (r) => setTimeout(() => presentRef.current(r), 120);
    queue.splice(0).forEach((r) => listener!(r));
    return () => { listener = null; };
  }, []);

  const close = (button?: DialogButton) => {
    if (!currentRef.current) return; // a double tap must not run the handler twice
    currentRef.current = null;
    setCurrent(null);
    const next = pending.current.shift();
    if (next) setTimeout(() => presentRef.current(next), 150);
    // run the handler after the dialog is gone so any follow-up modal can open
    if (button?.onPress) setTimeout(button.onPress, 0);
  };

  if (!current) return null;
  const cancel = current.buttons.find((b) => b.style === 'cancel');
  const stacked = current.buttons.length > 2;
  // cancel on the left / top, the main action on the right / bottom
  const ordered = [...current.buttons].sort((a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel'));

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => close(cancel)}>
      <Animated.View style={[styles.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => cancel && close(cancel)} />
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity: fade }]}>
          <Text style={styles.title}>{current.title}</Text>
          {!!current.message && <Text style={styles.message}>{noOrphan(current.message)}</Text>}
          <View style={[styles.buttons, stacked && { flexDirection: 'column' }]}>
            {ordered.map((b, i) => (
              <Button
                key={i}
                compact
                title={b.text ?? 'OK'}
                variant={b.style === 'destructive' ? 'destructive' : b.style === 'cancel' ? 'soft' : 'primary'}
                style={{ flex: stacked ? undefined : 1 }}
                onPress={() => close(b)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: colors.card, borderRadius: 24, padding: space.xl,
  },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: space.sm },
  buttons: { flexDirection: 'row', gap: space.sm + 2, marginTop: space.xl - 4 },
});
