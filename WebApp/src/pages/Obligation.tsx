import { useIsMobile, useQuarters } from '@/hooks';
import { formatDateMDY } from '@/utils/dateutil';

export default function Obligation() {
  const { quarters, loading, current, owedNow } = useQuarters();
  const isMobile = useIsMobile();

  if (loading) return <p className="empty">Loading…</p>;
  if (quarters.length === 0) {
    return (
      <>
        {!isMobile && <h1 className="page-title">Obligation</h1>}
        <div className="card empty">No obligation was found for you for the selected year.</div>
      </>
    );
  }

  const ok = owedNow <= 0;
  return (
    <>
      {!isMobile && <h1 className="page-title">Obligation</h1>}
      <div className="stats">
        <div className={`stat big ${ok ? 'good' : 'bad'}`}>
          <span className="stat-label">{ok && owedNow < 0 ? 'Minutes ahead' : 'Minutes owed'} (current quarter)</span>
          <span className="stat-value">{ok ? Math.max(-owedNow, 0) : owedNow}</span>
          <span className="stat-note">{!ok ? 'Keep going!' : owedNow < 0 ? 'You’re ahead of your obligation 🎉' : 'You’re all caught up 🎉'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Weekly obligation</span>
          <span className="stat-value">{current ? current.ObligationPerWeek : 0}<small> min</small></span>
        </div>
        <div className="stat">
          <span className="stat-label">Chazered this quarter</span>
          <span className="stat-value">{current ? Math.floor(current.MinutesChazered) : 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Paid this quarter</span>
          <span className="stat-value">${current ? current.AmountPaid.toFixed(2) : '0.00'}</span>
        </div>
      </div>

      <h2 className="section-title">Quarters</h2>
      <div className="quarters">
        {quarters.filter((q) => q.IsActive).map((q) => {
          const pct = q.MinutesOwed > 0 ? Math.min(100, (q.MinutesChazered / q.MinutesOwed) * 100) : 100;
          return (
            <section key={q.QuarterIndex} className="card quarter">
              <div className="q-head">
                <h3>Quarter {q.QuarterIndex}</h3>
                <span className="muted small">{formatDateMDY(q.QuarterStart)} – {formatDateMDY(q.QuarterEnd)}</span>
              </div>
              <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div style={{ width: `${pct}%` }} />
              </div>
              <dl>
                <div><dt>Minutes owed</dt><dd>{Math.ceil(q.MinutesOwed)}</dd></div>
                <div><dt>Minutes chazered</dt><dd>{Math.floor(q.MinutesChazered)}</dd></div>
                <div><dt>Amount paid</dt><dd>${q.AmountPaid.toFixed(2)}</dd></div>
                {q.FinalAmountOwed !== 0 && (
                  <div className={q.FinalAmountOwed > 0 ? 'bad' : 'good'}>
                    <dt>Final amount owed</dt><dd>${q.FinalAmountOwed.toFixed(2)}</dd>
                  </div>
                )}
              </dl>
            </section>
          );
        })}
      </div>
    </>
  );
}
