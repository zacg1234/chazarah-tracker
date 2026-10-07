import { supabase } from '@/services/supabaseClient';
import type { Session } from '@/types/session';
import type { Year } from '@/types/year';
import { endOfDay, parseLocal } from './dateutil';
import { getYearFirstDay } from './yearutils';
import { enqueueSession, isNetworkError, withTimeout } from './offlineQueue';

// CREATE
export async function createSession(session: Omit<Session, 'SessionId'>, year: Year) {
  if (validateSessionData(session, year)){
    // Timed out like the queue flush, so a stalled connection falls back to the offline queue
    const { data, error } = await withTimeout(supabase
      .from('TblSession')
      .insert([session])
      .select()
      .single());
    if (error) throw error;
    return data as Session;
  }
}

// CREATE, or hold on to the session on this device if there is no connection.
// Validation runs first so a bad session is never queued; only network failures are queued.
export async function createSessionOrQueue(session: Omit<Session, 'SessionId'>, year: Year, ownerId: string): Promise<'saved' | 'queued'> {
  validateSessionData(session, year);
  try {
    await createSession(session, year);
    return 'saved';
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await enqueueSession(ownerId, session);
    return 'queued';
  }
}

// READ (all for user and year)
export async function getSessionsByUserAndYear(UserId: string, YearId: number) {
  const { data, error } = await supabase
    .from('TblSession')
    .select('*')
    .eq('UserId', UserId)
    .eq('YearId', YearId)
    .order('SessionStartTime', { ascending: true });
  if (error) throw error;
  return data as Session[];
}

// Filter a given list of sessions between two dates (inclusive)
export function filterSessionsBetweenDates(sessions: Session[], startDate: string, endDate: string) {
  // Normalize start/end bounds (inclusive). If only date provided, assume full-day span.
  const normalizedStart = startDate.length === 10 ? `${startDate} 00:00:00` : startDate;
  const normalizedEnd = endDate.length === 10 ? `${endDate} 23:59:59` : endDate;

  const start = parseLocal(normalizedStart);
  const end = parseLocal(normalizedEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const filtered = sessions.filter((s) => {
    const raw = s.SessionStartTime;
    if (!raw) return false;
    const d = parseLocal(raw);
    if (isNaN(d.getTime())) return false;
    return d >= start && d <= end;
  });
  // Input is already sorted ascending (same as the DB query), and filter keeps order
  return filtered;
}

// UPDATE
export async function updateSession(SessionId: number, updates: Partial<Omit<Session, 'SessionId'>>, year: Year) {
  if (validateSessionData(updates, year)){
    const { data, error } = await supabase
        .from('TblSession')
        .update(updates)
        .eq('SessionId', SessionId)
        .select()
        .single();
      if (error) throw error;
      return data as Session;
  }
}

// DELETE
export async function deleteSession(SessionId: number) {
  const { error } = await supabase
    .from('TblSession')
    .delete()
    .eq('SessionId', SessionId);
  if (error) throw error;
  return true;
}



export const validateSessionData = (session: Partial<Session>, year: Year) => {
  let errorMsg = '';
  if (!session.SessionStartTime) errorMsg = 'Session start time is required.';
  else if (!year || !year.StartDate || !year.EndDate) errorMsg = 'Year is missing start/end date.';
  else {
    const start = parseLocal(session.SessionStartTime);
    if (isNaN(start.getTime())) errorMsg = 'Session start time is invalid.';
    else {
      const now = new Date();
      const yearStart = getYearFirstDay(year); // sessions on StartDate itself fall in no quarter
      const yearEnd = endOfDay(parseLocal(year.EndDate)); // the whole last day counts
      if (isNaN(yearStart.getTime()) || isNaN(yearEnd.getTime())) errorMsg = 'Year start/end date is invalid.';
      else if (start > now) {
        errorMsg = 'Session start time cannot be in the future.';
      }
      else if (start < yearStart || start > yearEnd) {
        errorMsg = `Session start time must fall within Jewish year ${year.JewishYear} (${yearStart.toLocaleDateString()} - ${yearEnd.toLocaleDateString()}).`;
      }
    }
  }
  if (errorMsg) {
    throw new Error(errorMsg);
  }
  return true;
}