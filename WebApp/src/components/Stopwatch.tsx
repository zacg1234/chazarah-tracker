import { useEffect, useRef, useState } from 'react';
import { getSkipNote, setSkipNote } from '@/utils/prefs';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/providers';
import ConfirmDialog from './ConfirmDialog';
import { createSession } from '@/utils/sessionutil';
import { toLocalTimestamp } from '@/utils/dateutil';

const STORAGE_PREFIX = 'chazarah_stopwatch';
const pad = (n: number) => n.toString().padStart(2, '0');

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

function loadSaved(storageKey: string) {
  try {
    const json = localStorage.getItem(storageKey);
    if (json) return JSON.parse(json);
  } catch { /* ignore */ }
  return {};
}

export default function Stopwatch() {
  const { selectedYear, refreshSessions, activeProfile } = useAppData();
  // Each profile has its own timer, keyed by profile id so another login in this browser never sees it
  const STORAGE_KEY = `${STORAGE_PREFIX}_${activeProfile?.id ?? ''}`;
  const saved = useRef(loadSaved(STORAGE_KEY)).current;
  const [elapsed, setElapsed] = useState<number>(saved.elapsed ?? 0);
  const [isRunning, setIsRunning] = useState<boolean>(saved.isRunning ?? false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(saved.startTimestamp ?? null);
  // When the session first started. startTimestamp moves on every resume, so it can't be the session's start.
  const [sessionStart, setSessionStart] = useState<number | null>(saved.sessionStart ?? null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const navigate = useNavigate();

  // Persist so the timer survives reloads (like AsyncStorage on mobile)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ elapsed, isRunning, startTimestamp, sessionStart })); } catch { /* ignore */ }
  }, [STORAGE_KEY, elapsed, isRunning, startTimestamp, sessionStart]);

  // Tick; derive from the wall clock so background tabs stay accurate
  useEffect(() => {
    if (!isRunning || !startTimestamp) return;
    setElapsed(Date.now() - startTimestamp);
    const id = setInterval(() => setElapsed(Date.now() - startTimestamp), 500);
    return () => clearInterval(id);
  }, [isRunning, startTimestamp]);

  const playPause = () => {
    if (isRunning) setIsRunning(false);
    else {
      setStartTimestamp(Date.now() - elapsed);
      setSessionStart((s) => s ?? startTimestamp ?? Date.now());
      setIsRunning(true);
    }
  };

  const reset = () => {
    setConfirmReset(false);
    setIsRunning(false); setElapsed(0); setStartTimestamp(null); setSessionStart(null);
  };

  const submit = () => {
    setError('');
    // The tick can be up to 500ms behind the clock, so measure the final length now
    const length = isRunning && startTimestamp ? Date.now() - startTimestamp : elapsed;
    if (length < 1000) {
      setError('Start the timer first, then tap Submit.');
      return;
    }
    setElapsed(length);
    setIsRunning(false);
    if (getSkipNote()) {
      finalSubmit('', length);
      return;
    }
    setNote('');
    setNoteOpen(true);
  };

  // "Don't ask again" in the note prompt: remember the choice and save without a note
  const skipForever = () => {
    setSkipNote(true);
    finalSubmit('');
  };

  const finalSubmit = async (noteText: string, length: number = elapsed) => {
    const startedAt = sessionStart ?? startTimestamp;
    if (!selectedYear || !activeProfile || !startedAt) {
      setError('Session start time is missing. Please start the stopwatch before submitting.');
      return;
    }
    const SessionStartTime = toLocalTimestamp(new Date(startedAt));
    try {
      await createSession({ UserId: activeProfile.id, YearId: selectedYear.JewishYear, SessionLength: length, SessionNote: noteText, SessionStartTime }, selectedYear);
      await refreshSessions();
      setNoteOpen(false);
      setElapsed(0); setStartTimestamp(null); setSessionStart(null);
      navigate('/obligation');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="stopwatch">
      <div className="clock">{formatTime(elapsed)}</div>
      <div className="row">
        <button className="retro" onClick={playPause} aria-label={isRunning ? 'Pause' : 'Play'}>
          {isRunning ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l12-7.5z" /></svg>
          )}
        </button>
        <button className="retro" onClick={() => (elapsed > 0 ? setConfirmReset(true) : reset())} aria-label="Reset">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
        </button>
        <button className="retro alarm" onClick={submit}>SUBMIT</button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset timer?"
        message="This will discard the time on the stopwatch."
        confirmLabel="Reset"
        danger
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
      />

      {error && !noteOpen && <p className="msg error">{error}</p>}

      {noteOpen && (
        <div className="modal-overlay" onClick={() => setNoteOpen(false)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <h2>Add a note (optional)</h2>
            <textarea rows={3} autoFocus placeholder="Type a note..." value={note} onChange={(e) => setNote(e.target.value)} />
            {error && <p className="msg error">{error}</p>}
            <div className="row end">
              <button className="btn ghost" onClick={() => setNoteOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={() => finalSubmit(note)}>{note.trim() === '' ? 'Skip' : 'Submit'}</button>
            </div>
            <p className="center-btn"><button className="link-btn small" onClick={skipForever}>Don’t ask me for notes again</button></p>
          </div>
        </div>
      )}
    </div>
  );
}
