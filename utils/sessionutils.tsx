import { supabase } from '@/services/supabaseClient';
import type { Session } from '@/types/session';

// CREATE
export async function createSession(session: Omit<Session, 'SessionId'>) {
  const { data, error } = await supabase
    .from('TblSession')
    .insert([session])
    .select()
    .single();
  if (error) throw error;
  return data as Session;
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

// UPDATE
export async function updateSession(SessionId: number, updates: Partial<Omit<Session, 'SessionId'>>) {
  const { data, error } = await supabase
    .from('TblSession')
    .update(updates)
    .eq('SessionId', SessionId)
    .select()
    .single();
  if (error) throw error;
  return data as Session;
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