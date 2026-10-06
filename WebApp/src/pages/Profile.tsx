import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks';
import ConfirmDialog from '@/components/ConfirmDialog';
import { handleLogout } from '@/utils/authutil';
import { deleteAccount, getLoggedInUser, updateLoggedInUserProfile } from '@/utils/authutil';

export default function Profile() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await getLoggedInUser();
        setFirstname(u?.user_metadata?.firstname || '');
        setLastname(u?.user_metadata?.lastname || '');
        setEmail(u?.email || '');
      } catch {
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    try {
      await updateLoggedInUserProfile({ firstname, lastname, password });
      setPassword('');
      setInfo('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await deleteAccount();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p className="empty">Loading…</p>;

  return (
    <div className="narrow">
      {!isMobile && <h1 className="page-title">Profile</h1>}
      <form className="card" onSubmit={save}>
        <h2>Your details</h2>
        <div className="grid-2">
          <label className="field">First name<input value={firstname} onChange={(e) => setFirstname(e.target.value)} /></label>
          <label className="field">Last name<input value={lastname} onChange={(e) => setLastname(e.target.value)} /></label>
        </div>
        <label className="field">Email<input value={email} disabled /><span className="hint">Email can’t be changed.</span></label>
        <label className="field">New password
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
        </label>
        {error && <p className="msg error">{error}</p>}
        {info && <p className="msg ok">{info}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Back</button>
          <button className="btn primary">Save changes</button>
        </div>
      </form>

      {isMobile && (
        <section className="card m-links">
          <Link to="/chart">Progress chart</Link>
          <button className="btn outline block" onClick={async () => { await handleLogout(); navigate('/login', { replace: true }); }}>Log out</button>
        </section>
      )}

      <section className="card danger-zone">
        <div>
          <h2>Delete account</h2>
          <p className="muted">Permanently removes your account and all your sessions. This can’t be undone.</p>
        </div>
        <button className="btn danger" onClick={() => setConfirmDelete(true)}>Delete account</button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your entire profile, sessions, obligations and payments. This action cannot be undone."
        confirmLabel="Delete account"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
