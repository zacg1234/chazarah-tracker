import AsyncStorage from '@react-native-async-storage/async-storage';

const SKIP_NOTE_KEY = 'pref_skip_note';

// Whether the stopwatch should skip the "add a note" prompt (stored on this device)
export async function getSkipNote(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SKIP_NOTE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setSkipNote(skip: boolean) {
  try {
    await AsyncStorage.setItem(SKIP_NOTE_KEY, skip ? '1' : '0');
  } catch (e) {
    console.error('Failed to save preference', e);
  }
}
