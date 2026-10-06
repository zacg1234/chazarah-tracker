import { toPng } from 'html-to-image';
import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { supabase } from '@/services/supabaseClient';
import { getWeeksBetween } from '@/utils/obligationutil';
import { getQuartersForYear } from '@/utils/yearutils';

type Row = { initials: string; learned: number; extra: number; owed: number };

const COLORS = { learned: '#4f83e8', extra: '#93c47d', owed: '#ecc9c9' };
const FONT = "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', cursive";

async function loadChart(): Promise<{ year: number; rows: Row[] }> {
  const { data, error } = await supabase.rpc('get_chart_data');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return { year: 0, rows: [] };

  const first = data[0];
  const quarters = getQuartersForYear({ JewishYear: first.jewish_year, StartDate: String(first.start_date).slice(0, 10), EndDate: String(first.end_date).slice(0, 10) });
  if (quarters.length === 0) return { year: first.jewish_year, rows: [] };

  // Same basis as the app's Obligation screen: weeks from the first quarter's start until today
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const lastEnd = quarters[quarters.length - 1][1];
  const effectiveEnd = todayStr < lastEnd ? todayStr : lastEnd;
  const weeks = getWeeksBetween(quarters[0][0], effectiveEnd);

  const rows: Row[] = data.map((d: any) => {
    const owedTotal = Number(d.obligation_per_week) * weeks;
    const learnedTotal = Number(d.minutes_learned);
    return {
      initials: d.initials,
      learned: Math.round(Math.min(learnedTotal, owedTotal)),
      extra: Math.round(Math.max(learnedTotal - owedTotal, 0)),
      owed: Math.round(Math.max(owedTotal - learnedTotal, 0)),
    };
  });
  return { year: first.jewish_year, rows };
}

const RotatedTick = ({ x, y, payload }: any) => (
  <text x={x} y={y + 8} textAnchor="end" transform={`rotate(-60 ${x} ${y + 8})`} fontFamily={FONT} fontSize={14} fill="#222">
    {payload.value}
  </text>
);

export default function ChartPage() {
  const [state, setState] = useState<{ year: number; rows: Row[] } | null>(null);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!cardRef.current) return;
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#fffdfb',
        filter: (n) => !(n instanceof HTMLElement && n.dataset.noExport),
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `chazarah-progress${state?.year ? `-${state.year}` : ''}.png`;
      a.click();
    } catch (e: any) {
      setError(`Could not create image: ${e?.message ?? e}`);
    }
  };

  useEffect(() => {
    loadChart().then(setState).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="chart-page">
      <div className="chart-card" ref={cardRef} style={{ fontFamily: FONT }}>
        <h1 className="chart-title">Kollel Ateres Ami &nbsp;| {state?.year || ''} Chazarah Progress</h1>
        {error && <p className="msg error">Could not load chart data: {error}</p>}
        {!state && !error && <p className="muted center">Loading…</p>}
        {state && state.rows.length === 0 && <p className="muted center">No data available.</p>}
        {state && state.rows.length > 0 && (
          <>
          <div className="chart-legend">
            {[['owed', 'Minutes Owed to Date'], ['extra', 'Extra Minutes Learned'], ['learned', 'Minutes Learned to Date']].map(([k, label]) => (
              <span key={k}><i style={{ background: COLORS[k as keyof typeof COLORS] }} />{label}</span>
            ))}
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.rows} margin={{ top: 4, right: 24, left: 8, bottom: 8 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} horizontal={false} />
                <XAxis dataKey="initials" interval={0} height={64} tick={<RotatedTick />} axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={{ stroke: '#222', strokeWidth: 1.5 }}
                  tickLine={false}
                  tick={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, fill: '#222' }}
                  width={56}
                />
                <Bar dataKey="learned" stackId="a" fill={COLORS.learned} isAnimationActive={false} />
                <Bar dataKey="extra" stackId="a" fill={COLORS.extra} isAnimationActive={false} />
                <Bar dataKey="owed" stackId="a" fill={COLORS.owed} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-actions" data-no-export="1">
            <button className="btn primary" onClick={download}>Download PNG</button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
