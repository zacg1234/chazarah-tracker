import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData, useAuth } from '@/providers';
import { createSession, updateSession } from '@/utils/sessionutil';

type Props = {
  visible: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialSession?: { SessionId?: number; SessionStartTime: string; SessionLength: number; SessionNote?: string } | null;
};

const pad = (n: number) => n.toString().padStart(2, '0');
// 'YYYY-MM-DDTHH:mm' for <input type="datetime-local">
const toInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ManualSessionEntry({ visible, onClose, mode = 'add', initialSession }: Props) {
  const { user } = useAuth();
  const { selectedYear, refreshSessions } = useAppData();
  const navigate = useNavigate();
  const [when, setWhen] = useState(toInputValue(new Date()));
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (mode === 'edit' && initialSession) {
      // SessionStartTime is a local-time string 'YYYY-MM-DD HH:mm:ss'
      setWhen(initialSession.SessionStartTime.replace(' ', 'T').slice(0, 16));
      setMinutes(Math.round(initialSession.SessionLength / 60000).toString());
      setNote(initialSession.SessionNote || '');
    } else {
      setWhen(toInputValue(new Date()));
      setMinutes('');
      setNote('');
    }
  }, [visible, mode, initialSession]);

  if (!visible) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.id || !selectedYear?.JewishYear) return setError('User or year not selected.');
    if (!minutes || isNaN(Number(minutes)) || Number(minutes) <= 0) return setError('Please enter a valid session length in minutes.');
    if (!when) return setError('Session start time is required.');

    const SessionStartTime = `${when.replace('T', ' ')}:00`;
    setSaving(true);
    try {
      if (mode === 'edit' && initialSession?.SessionId) {
        await updateSession(initialSession.SessionId, { SessionStartTime, SessionLength: Number(minutes) * 60000, SessionNote: note }, selectedYear);
      } else {
        await createSession({ UserId: user.id, YearId: selectedYear.JewishYear, SessionLength: Number(minutes) * 60000, SessionNote: note, SessionStartTime }, selectedYear);
      }
      await refreshSessions();
      onClose();
      if (mode !== 'edit') navigate('/obligation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{mode === 'edit' ? 'Edit Session' : 'Manual Session Entry'}</h2>
        <label className="field">Start date &amp; time
          <input type="datetime-local" value={when} max={toInputValue(new Date())} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <label className="field">Length (minutes)
          <input type="number" min="1" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label className="field">Note (optional)
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="msg error">{error}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}
