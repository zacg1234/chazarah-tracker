import { requireOptionalNativeModule } from 'expo-modules-core';
import { PermissionsAndroid, Platform } from 'react-native';

export type NativeStopwatchState = {
  key: string;
  isRunning: boolean;
  startTimestamp: number; // epoch ms the clock would have started if it never paused
  elapsed: number;        // ms on the clock right now
  updatedAt: number;
};

// Null in builds that don't include the native module yet (older binaries, web): everything no-ops.
const Native = requireOptionalNativeModule<any>('StopwatchNotification');

// Native calls must never take the app down: log and carry on (or fall back to `fallback`)
function safe<T>(name: string, fn: () => T, fallback?: T): T | undefined {
  try { return fn(); } catch (e) { console.warn(`${name} failed`, e); return fallback; }
}

// Show/update the ongoing notification (Android) or Live Activity (iOS). The OS ticks the timer itself.
export function syncStopwatch(state: { key: string; title: string; isRunning: boolean; startTimestamp: number; elapsed: number }) {
  safe('syncStopwatch', () => Native?.sync(state.key, state.title, state.isRunning, state.startTimestamp, state.elapsed));
}

export function clearStopwatch() {
  safe('clearStopwatch', () => Native?.clear());
}

// What the notification buttons did while JS wasn't looking
export function getNativeState(): NativeStopwatchState | null {
  return safe('getNativeState', () => Native?.getState() ?? null, null) ?? null;
}

// Called when the notification's Pause/Resume is tapped while the app is alive
export function addToggleListener(cb: (state: NativeStopwatchState) => void) {
  if (!Native) return () => { };
  const sub = Native.addListener('onToggle', cb);
  return () => sub.remove();
}

// One-off notification, e.g. "Session saved locally"
export function postMessage(title: string, body: string) {
  safe('postMessage', () => Native?.postMessage(title, body));
}

// Android 13+ needs a runtime permission before notifications show (iOS asks natively on first use)
export async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    try { await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any); } catch { /* ignore */ }
  } else if (Platform.OS === 'ios') {
    try { await Native?.requestPermission?.(); } catch { /* ignore */ }
  }
}
