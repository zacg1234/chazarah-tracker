import NetInfo from '@react-native-community/netinfo';
import { showAlert } from '@/components/Dialog';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { flushQueue } from './offlineQueue';

// Pushes sessions saved while offline to the database: on mount, whenever the app returns to the
// foreground, and whenever the connection comes back.
export function useOfflineSync(ownerId: string | undefined, refreshSessions: () => Promise<void>) {
  const refreshRef = useRef(refreshSessions);
  refreshRef.current = refreshSessions;

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;

    const sync = async () => {
      const { synced, dropped } = await flushQueue(ownerId);
      if (cancelled) return;
      if (synced > 0) {
        await refreshRef.current();
        showAlert('Sessions synced', synced === 1 ? '1 saved session was posted.' : `${synced} saved sessions were posted.`);
      }
      if (dropped.length > 0) {
        showAlert('Some sessions could not be posted', dropped.map((d) => `${d.session.SessionStartTime}: ${d.reason}`).join('\n'));
      }
    };
    const safeSync = () => sync().catch((e) => console.error('Offline sync failed', e));

    safeSync();
    const appSub = AppState.addEventListener('change', (state) => { if (state === 'active') safeSync(); });
    // NetInfo is only a "try now" hint; the insert itself decides whether we are really online
    let wasOnline: boolean | null = null;
    const netUnsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (online && wasOnline === false) safeSync();
      wasOnline = online;
    });
    return () => { cancelled = true; appSub.remove(); netUnsub(); };
  }, [ownerId]);
}
