import { supabase } from '@/services/supabaseClient';
import type { Session } from '@/types/session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sessions that were submitted without a connection. They live in AsyncStorage until they can be
// inserted, and are keyed by the logged-in account (a sub-profile's session belongs to its owner's queue).
export type NewSession = Omit<Session, 'SessionId'>;
type QueuedSession = { localId: string; session: NewSession };

const queueKey = (ownerId: string) => `offline_sessions_${ownerId}`;
const YEARS_KEY = 'cached_years';

// ---- classifying errors ----
// Postgres/PostgREST errors carry a `code`; a failed fetch (no connection, timeout) does not.
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  if (error.code && !/^(ECONN|ETIMEDOUT|ENOTFOUND)/.test(String(error.code))) return false;
  return /network|fetch|timed? ?out|offline|internet|connection|abort/i.test(String(error.message ?? error));
}

// Errors that say "try again later" rather than "this row is bad" (expired token mid-flush, server hiccup).
// `status` is the HTTP status of the response (PostgrestError itself doesn't carry it).
function isRetryable(error: any, status = 0): boolean {
  if (isNetworkError(error)) return true;
  const code = String(error?.code ?? '');
  return code === 'PGRST301' || code === 'PGRST303' || status === 401 || status === 408 || status === 429 || status >= 500;
}

// A stalled connection must not hold the queue forever
const REQUEST_TIMEOUT_MS = 15000;
function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Network request timed out')), REQUEST_TIMEOUT_MS);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

// ---- queue storage ----
// Short read-modify-write sections only (never held across a network call), so a submit can always enqueue
let storageLock: Promise<unknown> = Promise.resolve();
function withStorageLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = storageLock.then(fn, fn);
  storageLock = run.catch(() => { });
  return run;
}

async function readQueue(ownerId: string): Promise<QueuedSession[]> {
  try {
    const json = await AsyncStorage.getItem(queueKey(ownerId));
    return json ? (JSON.parse(json) as QueuedSession[]) : [];
  } catch {
    return [];
  }
}
const writeQueue = (ownerId: string, items: QueuedSession[]) =>
  items.length ? AsyncStorage.setItem(queueKey(ownerId), JSON.stringify(items)) : AsyncStorage.removeItem(queueKey(ownerId));

let dirty = false; // something was queued after the running flush took its snapshot
export function enqueueSession(ownerId: string, session: NewSession) {
  return withStorageLock(async () => {
    dirty = true;
    const items = await readQueue(ownerId);
    items.push({ localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, session });
    await writeQueue(ownerId, items);
  });
}

const removeQueued = (ownerId: string, localId: string) =>
  withStorageLock(async () => writeQueue(ownerId, (await readQueue(ownerId)).filter((i) => i.localId !== localId)));

// ---- flushing ----
export type FlushResult = { synced: number; dropped: { session: NewSession; reason: string }[]; remaining: number };

// Insert queued sessions one by one. An item is removed only after it is safely on the server.
// Only one flush runs at a time. A caller that arrives meanwhile waits for it and gets an empty result, so the
// outcome is reported once; anything queued in the meantime is picked up by the running flush's next pass.
const NOTHING: FlushResult = { synced: 0, dropped: [], remaining: 0 };
let flushing: Promise<FlushResult> | null = null;
export function flushQueue(ownerId: string): Promise<FlushResult> {
  if (flushing) return flushing.then(() => NOTHING);
  flushing = doFlush(ownerId).finally(() => { flushing = null; });
  return flushing;
}

async function doFlush(ownerId: string): Promise<FlushResult> {
  const result: FlushResult = { synced: 0, dropped: [], remaining: 0 };
  do {
    dirty = false;
    const items = await readQueue(ownerId);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const s = item.session;
      let status = 0;
      try {
        // A previous attempt may have reached the server even though we never saw the reply
        const lookup = await withTimeout(
          supabase.from('TblSession').select('SessionId')
            .eq('UserId', s.UserId).eq('SessionStartTime', s.SessionStartTime).eq('SessionLength', s.SessionLength).limit(1)
        );
        status = lookup.status;
        if (lookup.error) throw lookup.error;
        if (!lookup.data?.length) {
          const insert = await withTimeout(supabase.from('TblSession').insert([s]));
          status = insert.status;
          if (insert.error) throw insert.error;
        }
        result.synced++;
        await removeQueued(ownerId, item.localId);
      } catch (error: any) {
        if (isRetryable(error, status)) {
          result.remaining = items.length - i; // still offline: no point trying the rest
          return result;
        }
        result.dropped.push({ session: s, reason: error?.message ?? 'Rejected by the server' });
        await removeQueued(ownerId, item.localId);
      }
    }
  } while (dirty);
  return result;
}
