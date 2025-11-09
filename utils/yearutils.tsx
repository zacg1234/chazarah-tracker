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

// Returns the quarters with their start and end dates along with quarter index
export function getQuartersForYear(year: Year): [string, string, number][] {
  // Use local time for all calculations
  const start = setStartOfDay(addDays(new Date(year.StartDate), 2));
  const end = setEndOfDay(new Date(year.EndDate));
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

  // Count days between start and end (exclusive)
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let days = Math.floor((endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000) + 1);
  let extraDay = 0;
  const remainderDays = days % 4;
  days -= remainderDays;
  extraDay = remainderDays;
  const daysPerQuarter = Math.floor(days / 4);

  const quarters: [string, string, number][] = [];
  let current = new Date(startDay);
  for (let i = 0; i < 4; i++) {
    const qStart = setStartOfDay(current);
    let qEnd;
    if (i === 3) {
      // Last quarter: add extra day and go to end
      qEnd = new Date(current);
      qEnd.setDate(qEnd.getDate() + daysPerQuarter + extraDay - 1);
      if (qEnd > endDay) qEnd = new Date(endDay);
      qEnd = setEndOfDay(qEnd);
    } else {
      qEnd = new Date(current);
      qEnd.setDate(qEnd.getDate() + daysPerQuarter - 1);
      qEnd = setEndOfDay(qEnd);
    }

    quarters.push([
      toLocaleStringISOFormat(qStart),
      toLocaleStringISOFormat(qEnd),
      i + 1
    ]);
    // Next quarter starts the day after this one ends
    current = new Date(qEnd);
    current.setDate(current.getDate() + 1);
    current = setStartOfDay(current);
  }
  return quarters;
}

// Helper to set time to start of day (00:01)
  function setStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 1, 0);
    return d;
  }
  // Helper to set time to end of day (23:59)
  function setEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 0);
    return d;
  }

  function toLocaleStringISOFormat(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }