import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/providers';
import { handleLogin } from '@/utils/authutil';
import { tryOpenMobileApp } from '@/utils/openapp';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, recovery } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Already signed in (saved session): just continue. We only hand off to the app on an actual login below.
    if (!authLoading && user && !recovery) navigate('/chazarah', { replace: true });
  }, [authLoading, user, recovery, navigate]);

  if (authLoading) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await handleLogin(email.trim(), password, setLoading);
      tryOpenMobileApp();
      navigate('/chazarah');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue tracking your chazarah."
      footer={<>Don’t have an account? <Link to="/signup">Sign up</Link></>}
    >
      <form onSubmit={submit}>
        <label className="field">Email
          <input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span className="field-row">Password
            <Link to="/forgot-password" state={{ email }} className="small-link">Forgot password?</Link>
          </span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="msg error">{error}</p>}
        <button className="btn primary block" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}
