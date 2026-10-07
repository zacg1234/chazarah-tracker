import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { EmailAlreadyUsedError, handleSignUp } from '@/utils/authutil';

export default function Signup() {
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailTaken(false);
    setLoading(true);
    try {
      await handleSignUp(email, password, firstname, lastname);
      navigate('/login');
    } catch (err: any) {
      if (err instanceof EmailAlreadyUsedError) setEmailTaken(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It only takes a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={submit}>
        <div className="grid-2">
          <label className="field">First name
            <input autoComplete="given-name" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </label>
          <label className="field">Last name
            <input autoComplete="family-name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </label>
        </div>
        <label className="field">Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Password
          <input type="text" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="hint">At least 6 characters.</span>
        </label>
        {emailTaken && (
          <div className="msg error">
            That email is already being used for a different account.
            <div className="row end" style={{ marginTop: 8 }}>
              <button type="button" className="btn ghost sm" onClick={() => setEmailTaken(false)}>Close</button>
              <button type="button" className="btn outline sm" onClick={() => navigate('/forgot-password', { state: { email } })}>Reset password</button>
            </div>
          </div>
        )}
        {error && <p className="msg error">{error}</p>}
        <button className="btn primary block" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
