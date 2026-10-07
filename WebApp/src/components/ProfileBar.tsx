import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '@/providers';

// Bar under the header showing whose minutes are being viewed/entered. Turns amber
// when that is not the logged-in user so entries never go to the wrong person.
export default function ProfileBar() {
  const { profiles, activeProfile, setActiveProfile } = useAppData();
  const [open, setOpen] = useState(false);
  if (profiles.length < 2 || !activeProfile) return null;

  return (
    <>
      <button className={`profile-bar ${activeProfile.isSelf ? '' : 'other'}`} onClick={() => setOpen(true)}>
        <span className="pb-name">{activeProfile.isSelf ? activeProfile.name : `Entering for ${activeProfile.name}`}</span>
        <span className="pb-switch">Switch ▾</span>
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <h2>Who are you entering for?</h2>
            <div className="pb-list">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  className={`pb-item ${p.id === activeProfile.id ? 'active' : ''}`}
                  onClick={() => { setActiveProfile(p.id); setOpen(false); }}
                >
                  {p.name}{p.isSelf ? ' (me)' : ''}{p.id === activeProfile.id ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <p className="center-btn"><Link to="/profile" onClick={() => setOpen(false)}>Manage family profiles</Link></p>
          </div>
        </div>
      )}
    </>
  );
}
