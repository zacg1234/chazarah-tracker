const SKIP_NOTE_KEY = 'pref_skip_note';

// Whether the stopwatch should skip the "add a note" prompt (stored in this browser)
export function getSkipNote(): boolean {
  try {
    return localStorage.getItem(SKIP_NOTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSkipNote(skip: boolean) {
  try {
    localStorage.setItem(SKIP_NOTE_KEY, skip ? '1' : '0');
  } catch {
    // storage unavailable; preference just won't persist
  }
}
