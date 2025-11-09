import { supabase } from '@/services/supabaseClient';
import type { Session } from '@/types/session';
import type { Year } from '@/types/year';
import { router } from 'expo-router';

// CREATE
export async function createSession(session: Omit<Session, 'SessionId'>, year: Year) {
  if (validateSessionData(session, year)){
    const { data, error } = await supabase
      .from('TblSession')
      .insert([session])
      .select()
      .single();
    if (error) throw error;
    router.replace('/obligation');
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


// year: { StartDate: string, EndDate: string, JewishYear: number, ... }
import { Alert } from 'react-native';

export const validateSessionData = (session: Partial<Session>, year: Year) => {
  let errorMsg = '';
  if (!session.SessionStartTime) errorMsg = 'Session start time is required.';
  else if (!year || !year.StartDate || !year.EndDate) errorMsg = 'Year is missing start/end date.';
  //else if (session.YearId != year.JewishYear) errorMsg = 'Session year does not match provided year.';
  else {
    const start = new Date(session.SessionStartTime);
    if (isNaN(start.getTime())) errorMsg = 'Session start time is invalid.';
    else {
      const yearStart = new Date(year.StartDate);
      const yearEnd = new Date(year.EndDate);
      if (isNaN(yearStart.getTime()) || isNaN(yearEnd.getTime())) errorMsg = 'Year start/end date is invalid.';
      else if (start < yearStart || start > yearEnd) {
        errorMsg = `Session start time must fall within Jewish year ${year.JewishYear} (${yearStart.toLocaleDateString()} - ${yearEnd.toLocaleDateString()}).`;
      }
    }
  }
  if (errorMsg) {
    Alert.alert('Invalid Session', errorMsg);
    return false;
  }
  return true;
}