import type { Year } from '@/types/year';
import { supabase } from '../services/supabaseClient';

export const fetchYears = async () => {
  const { data, error } = await supabase
    .from('TblYear')
    .select('JewishYear, StartDate, EndDate')
    .order('JewishYear', { ascending: false });

  if (error) {
    console.error('Error fetching years:', error);
    return [];
  }

  return data || [];
};

export const getCurrentYear = (years: Year[]) => {
  const today = new Date();
  return years.find(
    (y) =>
      y.StartDate &&
      y.EndDate &&
      new Date(y.StartDate) <= today &&
      today <= new Date(y.EndDate)
  );
};

export const isCurrentYear = (year: Year | null) => {
  const today = new Date();
  if (year?.StartDate && year?.EndDate) {
    return new Date(year.StartDate) <= today && today <= new Date(year.EndDate);
  }
  return false;
};


export function getQuartersForYear(year: Year): [string, string][] {
  const start = new Date(year.StartDate);
  const end = new Date(year.EndDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

  const totalMs = end.getTime() - start.getTime();
  const quarterMs = Math.floor(totalMs / 4);

  const quarters: [string, string][] = [];
  for (let i = 0; i < 4; i++) {
    const qStart = new Date(start.getTime() + i * quarterMs);
    // For last quarter, end at year end
    const qEnd = i === 3 ? end : new Date(start.getTime() + (i + 1) * quarterMs - 1);
    quarters.push([
      qStart.toISOString().slice(0, 10),
      qEnd.toISOString().slice(0, 10)
    ]);
  }
  return quarters;
}