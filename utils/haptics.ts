import * as Haptics from 'expo-haptics';

// Haptics are a nicety: never let a failure (simulator, unsupported device) surface
export const tap = () => { Haptics.selectionAsync().catch(() => { }); };
export const impact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => { Haptics.impactAsync(style).catch(() => { }); };
export const warn = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { }); };
