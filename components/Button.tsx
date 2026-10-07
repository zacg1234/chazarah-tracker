import { Text } from '@/components/Text';
import { colors, radii } from '@/constants/theme';
import { impact } from '@/utils/haptics';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Variant = 'primary' | 'tonal' | 'destructive' | 'soft' | 'ghost' | 'ghostDestructive';
type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palette: Record<Variant, { bg: string; fg: string; border?: string; shadow?: string }> = {
  primary: { bg: colors.primary, fg: '#fff', shadow: '0 4px 12px rgba(37,99,235,0.22)' },
  // Same look as IconButton: soft tinted fill + thin border
  tonal: { bg: colors.primarySoft, fg: colors.primary, border: '#bfd0fb' },
  destructive: { bg: colors.bad, fg: '#fff', shadow: '0 4px 12px rgba(198,40,40,0.2)' },
  soft: { bg: colors.soft, fg: colors.ink, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.primary },
  ghostDestructive: { bg: 'transparent', fg: colors.bad },
};

// The one button used everywhere: rounded, soft shadow on filled variants, press scale + light haptic
export default function Button({ title, onPress, variant = 'primary', loading, disabled, compact, style }: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      disabled={inactive}
      onPress={() => { impact(); onPress?.(); }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent', borderWidth: p.border ? 1.5 : 0 },
        p.shadow ? ({ boxShadow: p.shadow } as ViewStyle) : null,
        inactive && { opacity: 0.55 },
        pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={p.fg} /> : <Text style={[styles.text, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radii.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 44, borderRadius: radii.pill, paddingHorizontal: 8 },
  text: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
});
