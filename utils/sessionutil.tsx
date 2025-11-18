import { supabase } from '@/services/supabaseClient';
import type { Session } from '@/types/session';
import type { Year } from '@/types/year';

// CREATE
export async function createSession(session: Omit<Session, 'SessionId'>, year: Year) {
  if (validateSessionData(session, year)){
    const { data, error } = await supabase
      .from('TblSession')
      .insert([session])
      .select()
      .single();
    if (error) throw error;
    return data as Session;
  }
}

// READ (by SessionId)
export async function getSessionById(SessionId: number) {
  const { data, error } = await supabase
    .from('TblSession')
    .select('*')
    .eq('SessionId', SessionId)
    .single();
  if (error) throw error;
  return data as Session;
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

// READ (sessions for user between dates)
export async function getSessionsByUserBetweenDates(UserId: string, startDate: string, endDate: string) {
   const endDateTime = endDate.length === 10 ? `${endDate} 23:59:59` : endDate;
  const { data, error } = await supabase
    .from('TblSession')
    .select('*')
    .eq('UserId', UserId)
    .gte('SessionStartTime', startDate)
    .lte('SessionStartTime', endDateTime)
    .order('SessionStartTime', { ascending: true });
  if (error) throw error;
  return data as Session[];
}

// Filter a given list of sessions between two dates (inclusive)
export async function filterSessionsBetweenDates(sessions: Session[], startDate: string, endDate: string) {
  // Normalize start/end bounds (inclusive). If only date provided, assume full-day span.
  const normalizedStart = startDate.length === 10 ? `${startDate} 00:00:00` : startDate;
  const normalizedEnd = endDate.length === 10 ? `${endDate} 23:59:59` : endDate;

  const start = new Date(normalizedStart.replace(' ', 'T'));
  const end = new Date(normalizedEnd.replace(' ', 'T'));
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const filtered = sessions.filter((s) => {
    const raw = s.SessionStartTime;
    if (!raw) return false;
    const d = new Date(raw.replace(' ', 'T'));
    if (isNaN(d.getTime())) return false;
    return d >= start && d <= end;
  });

  // Sort ascending like the DB query
  filtered.sort((a, b) => {
    const da = new Date(a.SessionStartTime.replace(' ', 'T')).getTime();
    const db = new Date(b.SessionStartTime.replace(' ', 'T')).getTime();
    return da - db;
  });
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
    const start = new Date(session.SessionStartTime);
    if (isNaN(start.getTime())) errorMsg = 'Session start time is invalid.';
    else {
      const now = new Date();
      const yearStart = new Date(year.StartDate);
      const yearEnd = new Date(year.EndDate);
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