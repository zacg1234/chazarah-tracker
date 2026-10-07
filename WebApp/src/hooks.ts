import { useEffect, useState } from 'react';
import { useAppData } from '@/providers';
import { getUserQuarters } from '@/utils/obligationutil';

// Quarter breakdown for the logged-in user and selected year
export function useQuarters() {
  const { selectedYear, sessions, activeProfile } = useAppData();
  const [quarters, setQuarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const q = activeProfile?.id && selectedYear ? await getUserQuarters(activeProfile.id, selectedYear, sessions) : [];
        if (active) setQuarters(q);
      } catch {
        if (active) setQuarters([]);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [activeProfile?.id, selectedYear, sessions]);

  const current = quarters.slice().reverse().find((q) => q.IsActive);
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
