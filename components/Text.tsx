import { fontFamilies } from '@/constants/theme';
import React, { createContext, useContext } from 'react';
// eslint-disable-next-line no-restricted-imports -- this file is the wrapper around the native components
import { Platform, StyleSheet, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps, type TextStyle } from 'react-native';

// Drop-in replacements for Text/TextInput that use Inter. fontWeight picks the matching Inter file
// (so Android renders weights correctly); an explicit fontFamily in the style always wins.
const ANDROID_NO_PADDING = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : null;
const cache = new WeakMap<object, TextStyle>();

function compute(style: TextProps['style'], nested: boolean): TextStyle {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  if (flat.fontFamily) return flat;
  // A nested <Text> with no weight of its own keeps its parent's font (e.g. plain text inside a bold line)
  if (nested && !flat.fontWeight) return flat;
  const w = flat.fontWeight === 'bold' ? '700' : flat.fontWeight === 'normal' || !flat.fontWeight ? '400' : String(flat.fontWeight);
  const key = (w === '100' || w === '200' || w === '300' ? '400' : w === '900' ? '800' : w) as keyof typeof fontFamilies;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: fontFamilies[key] ?? fontFamilies['400'], ...ANDROID_NO_PADDING } as TextStyle;
}

// Styles from StyleSheet.create are stable objects, so their resolved form is computed once
function resolve(style: TextProps['style'], nested: boolean): TextStyle {
  if (!nested && style && typeof style === 'object' && !Array.isArray(style)) {
    let hit = cache.get(style);
    if (!hit) { hit = compute(style, false); cache.set(style, hit); }
    return hit;
  }
  return compute(style, nested);
}

const InsideText = createContext(false);

export const Text = React.forwardRef<RNText, TextProps>(({ style, ...props }, ref) => {
  const nested = useContext(InsideText);
  return (
    <InsideText.Provider value>
      <RNText ref={ref} {...props} style={resolve(style, nested)} />
    </InsideText.Provider>
  );
});
Text.displayName = 'Text';

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => (
  <RNTextInput ref={ref} {...props} style={resolve(style, false)} />
));
TextInput.displayName = 'TextInput';
