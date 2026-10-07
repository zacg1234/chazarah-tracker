import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { sendPasswordReset } from '@/utils/authutil';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState<string>((location.state as any)?.email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Forgot your password?'}
      subtitle={sent ? undefined : 'We’ll email you a link to reset your password.'}
      footer={<Link to="/login">← Back to log in</Link>}
    >
      {sent ? (
        <>
          <p className="msg ok">
            If an account exists for <b>{email.trim()}</b>, a reset link is on its way. The link opens a page where you can choose a new password.
          </p>
          <p className="hint">Nothing there? Check your spam folder, or <button type="button" className="link-btn" onClick={() => setSent(false)}>try a different email</button>.</p>
        </>
      ) : (
        <form onSubmit={submit}>
          <label className="field">Email
            <input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          {error && <p className="msg error">{error}</p>}
          <button className="btn primary block" disabled={sending}>{sending ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  );
}
