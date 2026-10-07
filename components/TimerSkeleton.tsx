import FadeIn from '@/components/FadeIn';
import { colors, radii, softShadow } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Soft pulsing placeholder shaped like the stopwatch. It only appears if loading takes longer than a
// moment, so on a fast load nothing flashes on screen at all.
export default function TimerSkeleton({ delay = 150 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <FadeIn show={visible} duration={180} style={styles.wrap}>
      <Animated.View style={{ opacity: pulse, alignItems: 'center' }}>
        <View style={styles.card}>
          <View style={styles.time} />
          <View style={styles.label} />
        </View>
        <View style={styles.buttons}>
          <View style={[styles.button, { width: 70 }]} />
          <View style={[styles.button, { width: 70 }]} />
          <View style={[styles.button, { width: 174 }]} />
        </View>
      </Animated.View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  card: { width: 236, height: 160, borderRadius: 32, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 16, ...softShadow },
  time: { width: 150, height: 54, borderRadius: radii.md, backgroundColor: colors.line },
  label: { width: 64, height: 10, borderRadius: 5, backgroundColor: colors.line },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 28 },
  button: { height: 64, borderRadius: radii.md, backgroundColor: colors.line },
});
