import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/providers';
import { getObligationData, getUserQuarters, type ObligationData } from '@/utils/obligationutil';

// Quarter breakdown for the logged-in user and selected year
export function useQuarters() {
  const { selectedYear, sessions, activeProfile } = useAppData();
  const [data, setData] = useState<ObligationData | null>(null);
  const [loading, setLoading] = useState(true);

  // Obligation and payments only change with the profile/year; session changes just recompute the totals below
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = activeProfile?.id && selectedYear ? await getObligationData(activeProfile.id, selectedYear) : null;
        if (active) setData(result);
      } catch {
        if (active) setData(null);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [activeProfile?.id, selectedYear]);

  const quarters = useMemo(() => getUserQuarters(data, sessions), [data, sessions]);
  const started = quarters.filter((q) => q.IsActive);
  const current = started[started.length - 1];
  const owedNow = current ? Math.ceil(current.MinutesOwed - current.MinutesChazered) : 0;
  return { quarters, loading, current, owedNow };
}

// True when the viewport is phone-sized. Drives the separate mobile / web layouts.
export const MOBILE_QUERY = '(max-width: 720px)';
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
