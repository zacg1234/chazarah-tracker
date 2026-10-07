import { Text, TextInput } from '@/components/Text';
import { colors, inputStyle } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

// The text field used on the sign-in screens: highlights when focused, and password fields get a show/hide eye
export default function FormInput({ secureToggle, style, ...props }: TextInputProps & { secureToggle?: boolean; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const secure = !!secureToggle && hidden;

  return (
    <View style={[{ width: '100%', justifyContent: 'center' }, style]}>
      <TextInput
        placeholderTextColor={colors.placeholder}
        {...props}
        secureTextEntry={secureToggle ? secure : props.secureTextEntry}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[inputStyle, focused && { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(37,99,235,0.15)' }, secureToggle && { paddingRight: 48 }]}
      />
      {secureToggle && (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={10}
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          style={{ position: 'absolute', right: 14 }}
        >
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
