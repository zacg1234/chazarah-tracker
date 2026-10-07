import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppData, useAuth } from '@/providers';
import { createSubAccount, deleteSubAccount } from '@/utils/profileutil';
import { getSkipNote, setSkipNote } from '@/utils/prefs';
import { deleteAccount, handleLogout, getLoggedInUser, updateLoggedInUserProfile } from '@/utils/authutil';

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
  const [askForNote, setAskForNote] = useState(!getSkipNote());
  const { user } = useAuth();
  const { profiles, activeProfile, setActiveProfile, reloadProfiles } = useAppData();
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

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
      reloadProfiles().catch(() => {});
      setInfo('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(''); setInfo('');
    setAdding(true);
    try {
      const created = await createSubAccount(user, newFirst, newLast);
      await reloadProfiles();
      setActiveProfile(created.id);
      setNewFirst(''); setNewLast('');
      setInfo(`${created.name} was added. Ask your administrator to set their weekly obligation.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const removeProfile = async () => {
    if (!removeTarget || !user) return;
    const { id } = removeTarget;
    setRemoveTarget(null);
    try {
      await deleteSubAccount(id);
      if (activeProfile?.id === id) setActiveProfile(user.id);
      await reloadProfiles();
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
        <label className="check">
          <input type="checkbox" checked={askForNote} onChange={(e) => { setAskForNote(e.target.checked); setSkipNote(!e.target.checked); }} />
          <span>Ask for a note after timer sessions</span>
        </label>
        {error && <p className="msg error">{error}</p>}
        {info && <p className="msg ok">{info}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={() => navigate(-1)}>Back</button>
          <button className="btn primary">Save changes</button>
        </div>
      </form>

      <form className="card" onSubmit={addProfile}>
        <h2>Family profiles</h2>
        <p className="muted small">Add a family member to enter their minutes from your account, then switch between profiles from the bar at the top.</p>
        {profiles.filter((p) => !p.isSelf).map((p) => (
          <div key={p.id} className="family-row">
            <span>{p.name}</span>
            <button type="button" className="btn danger-outline sm" onClick={() => setRemoveTarget({ id: p.id, name: p.name })}>Remove</button>
          </div>
        ))}
        <div className="grid-2" style={{ marginTop: 14 }}>
          <label className="field">First name<input value={newFirst} onChange={(e) => setNewFirst(e.target.value)} /></label>
          <label className="field">Last name<input value={newLast} onChange={(e) => setNewLast(e.target.value)} /></label>
        </div>
        <div className="row end"><button className="btn outline" disabled={adding}>{adding ? 'Adding…' : 'Add family member'}</button></div>
      </form>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove profile?"
        message={`Remove ${removeTarget?.name ?? ''} and all of their sessions? This can’t be undone.`}
        confirmLabel="Remove"
        danger
        onConfirm={removeProfile}
        onCancel={() => setRemoveTarget(null)}
      />

      {isMobile && (
        <section className="card m-links">
          <button className="btn outline block" onClick={async () => { await handleLogout(); navigate('/login', { replace: true }); }}>Log out</button>
        </section>
      )}

      <section className="card danger-zone">
        <div>
          <h2>Delete account</h2>
          <p className="muted">Permanently removes your account and all your sessions. This can’t be undone.</p>
        </div>
        <button className="btn danger-outline" onClick={() => setConfirmDelete(true)}>Delete account</button>
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
