import { colors } from '@/constants/theme';
import { impact } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; // accessibility label (there is no visible text)
  onPress?: () => void;
  destructive?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// Compact round icon button, for actions that don't need a text label (e.g. delete)
export default function IconButton({ icon, label, onPress, destructive, size = 44, style }: Props) {
  const fg = destructive ? colors.bad : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => { impact(); onPress?.(); }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: destructive ? colors.badSoft : colors.primarySoft,
          borderWidth: 1.5,
          borderColor: destructive ? '#f5c2c2' : '#bfd0fb',
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={fg} />
    </Pressable>
  );
}
