import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/providers';
import { supabase } from '@/services/supabaseClient';
import { setNewPassword } from '@/utils/authutil';

// Landing page for the link in Supabase's password-reset email.
// supabase-js reads the recovery token from the URL and creates a session
// (PASSWORD_RECOVERY), which lets the user set a new password here.
export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Supabase puts failures (e.g. expired link) in the URL hash
  const hashError = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    try {
      await setNewPassword(password);
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password updated" footer={<Link to="/login">Go to log in</Link>}>
        <p className="msg ok">Your password has been changed. Redirecting you to log in…</p>
      </AuthShell>
    );
  }
  if (authLoading) return null;
  if (!user) {
    return (
      <AuthShell title="Link expired" footer={<Link to="/login">← Back to log in</Link>}>
        <p className="msg error">{hashError ? hashError.replace(/\+/g, ' ') : 'This reset link is invalid or has expired.'}</p>
        <Link className="btn primary block center-btn" to="/forgot-password">Request a new link</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={submit}>
        <label className="field">New password
          <input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="hint">At least 6 characters.</span>
        </label>
        <label className="field">Confirm new password
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="msg error">{error}</p>}
        <button className="btn primary block" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}
