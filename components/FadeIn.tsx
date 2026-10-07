import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

// Fades its children in (and out) so content that appears after loading never pops in abruptly
export default function FadeIn({ show = true, duration = 220, style, children }: {
  show?: boolean; duration?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: show ? 1 : 0, duration, useNativeDriver: true }).start();
  }, [show, duration, opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
