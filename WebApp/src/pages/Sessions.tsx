import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks';
import ConfirmDialog from '@/components/ConfirmDialog';
import ManualSessionEntry from '@/components/ManualSessionEntry';
import { useAppData } from '@/providers';
import { formatDateMDY } from '@/utils/dateutil';
import { deleteSession } from '@/utils/sessionutil';
import { msToMinutes, to12HourTime } from '@/utils/timeutil';
import { isCurrentYear } from '@/utils/yearutils';

export default function Sessions() {
  const { sessions, refreshSessions, selectedYear, sessionsLoading } = useAppData();
  const [editSession, setEditSession] = useState<any | null>(null);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [error, setError] = useState('');
  const editable = isCurrentYear(selectedYear);
  const isMobile = useIsMobile();
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = useMemo(() => sessions.slice().reverse(), [sessions]); // newest first
  const totalMin = useMemo(() => Math.floor(sessions.reduce((a, s) => a + s.SessionLength, 0) / 60000), [sessions]);

  const confirmDelete = async () => {
    const s = toDelete;
    setToDelete(null);
    try {
      await deleteSession(s.SessionId);
      await refreshSessions();
    } catch {
      setError('Failed to delete session.');
    }
  };

  return (
    <>
      <div className="title-row">
        {!isMobile && <h1 className="page-title">Sessions</h1>}
        <div className="muted">{sessions.length} sessions · <b>{totalMin.toLocaleString()}</b> min total</div>
      </div>
      {error && <p className="msg error">{error}</p>}
      {!editable && <p className="notice">Sessions from previous years can’t be edited or deleted.</p>}

      {isMobile ? (
        <div className="m-list">
          {sessionsLoading && rows.length === 0 && <p className="empty">Loading…</p>}
          {!sessionsLoading && rows.length === 0 && <p className="empty">No sessions for this year yet.</p>}
          {rows.map((s) => {
            const open = openId === s.SessionId;
            return (
              <div key={s.SessionId} className={`m-item${open ? ' open' : ''}`}>
                <button className="m-item-main" onClick={() => setOpenId(open ? null : s.SessionId)}>
                  <div>
                    <b>{formatDateMDY(s.SessionStartTime)}</b>
                    <div className="muted small">{to12HourTime(s.SessionStartTime)}</div>
                  </div>
                  <span className="pill">{msToMinutes(s.SessionLength)}</span>
                </button>
                {open && (
                  <div className="m-item-detail">
                    <p>{s.SessionNote || <span className="muted">No note</span>}</p>
                    {editable && (
                      <div className="row">
                        <button className="btn outline grow" onClick={() => setEditSession(s)}>Edit</button>
                        <button className="btn danger-outline grow" onClick={() => setToDelete(s)}>Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="card table-card">
        {sessionsLoading && rows.length === 0 ? (
          <p className="empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="empty">No sessions for this year yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Start</th><th>Duration</th><th>Note</th>{editable && <th aria-label="Actions" />}</tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.SessionId}>
                  <td data-label="Date">{formatDateMDY(s.SessionStartTime)}</td>
                  <td data-label="Start">{to12HourTime(s.SessionStartTime)}</td>
                  <td data-label="Duration"><span className="pill">{msToMinutes(s.SessionLength)}</span></td>
                  <td data-label="Note" className="note">{s.SessionNote || <span className="muted">—</span>}</td>
                  {editable && (
                    <td className="actions">
                      <button className="btn sm outline" onClick={() => setEditSession(s)}>Edit</button>
                      <button className="btn sm danger-outline" onClick={() => setToDelete(s)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      <ManualSessionEntry visible={!!editSession} onClose={() => setEditSession(null)} mode="edit" initialSession={editSession} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete session?"
        message={toDelete ? `This will permanently delete the ${msToMinutes(toDelete.SessionLength)} session from ${formatDateMDY(toDelete.SessionStartTime)}.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
