import { Text } from '@/components/Text';
import { colors } from '@/constants/theme';
import React from 'react';
import { Pressable } from 'react-native';

// "Don't have an account? Sign up": quiet lead-in text, with the action in bold brand blue
export default function AuthLink({ lead, action, onPress }: { lead?: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ marginTop: 28, paddingVertical: 8 }}>
      <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
        {lead ? `${lead} ` : ''}
        <Text style={{ color: colors.primary, fontWeight: '700' }}>{action}</Text>
      </Text>
    </Pressable>
  );
}
