import { useState } from 'react';
import { Link } from 'react-router-dom';
import ManualSessionEntry from '@/components/ManualSessionEntry';
import Stopwatch from '@/components/Stopwatch';
import { useIsMobile, useQuarters } from '@/hooks';
import { useAppData } from '@/providers';
import { formatDateMDY } from '@/utils/dateutil';
import { msToMinutes, to12HourTime } from '@/utils/timeutil';
import { isCurrentYear } from '@/utils/yearutils';

export default function Chazarah() {
  const { selectedYear, sessions, activeProfile } = useAppData();
  const { current, owedNow, loading } = useQuarters();
  const [manualVisible, setManualVisible] = useState(false);
  const recent = sessions.slice(-5).reverse();
  const active = isCurrentYear(selectedYear);
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && <h1 className="page-title">Timer</h1>}
      <div className={isMobile ? 'dash m-dash' : 'dash'}>
        <section className="card timer-card">
          {active ? (
            <>
              {activeProfile && <Stopwatch key={activeProfile.id} />}
              <button className="btn outline" onClick={() => setManualVisible(true)}>+ Add a session manually</button>
              <ManualSessionEntry visible={manualVisible} onClose={() => setManualVisible(false)} mode="add" />
            </>
          ) : (
            <p className="empty">The stopwatch is only available for the current year.</p>
          )}
        </section>

        <aside className="side">
          {current && !loading && (
            <div className={`stat ${owedNow <= 0 ? 'good' : 'bad'}`}>
              <span className="stat-label">Owed this quarter</span>
              <span className="stat-value">{Math.max(owedNow, 0)} <small>min</small></span>
            </div>
          )}
          <section className="card">
            <div className="card-head">
              <h2>Recent sessions</h2>
              <Link to="/sessions" className="small-link">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="muted">No sessions yet.</p>
            ) : (
              <ul className="recent">
                {recent.map((s) => (
                  <li key={s.SessionId}>
                    <div>
                      <b>{formatDateMDY(s.SessionStartTime)}</b>
                      <span className="muted small"> · {to12HourTime(s.SessionStartTime)}</span>
                    </div>
                    <span className="pill">{msToMinutes(s.SessionLength)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
