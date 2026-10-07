import type { Year } from '@/types/year';
import { supabase } from '../services/supabaseClient';
import { endOfDay, parseLocal, toLocalTimestamp } from './dateutil';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Last list of years we saw, so the stopwatch can still be submitted after an offline cold start
const YEARS_KEY = 'cached_years';
async function cacheYears(years: Year[]) {
  try { await AsyncStorage.setItem(YEARS_KEY, JSON.stringify(years)); } catch { /* best effort */ }
}
async function getCachedYears(): Promise<Year[]> {
  try {
    const json = await AsyncStorage.getItem(YEARS_KEY);
    return json ? (JSON.parse(json) as Year[]) : [];
  } catch {
    return [];
  }
}

export const fetchYears = async () => {
  const { data, error } = await supabase
    .from('TblYear')
    .select('JewishYear, StartDate, EndDate')
    .order('JewishYear', { ascending: false });

  if (error) {
    console.error('Error fetching years:', error);
    return getCachedYears(); // offline: fall back to the last list we saw
  }

  if (data?.length) cacheYears(data);
  return data || [];
};

// A year runs from its StartDate through the end of its EndDate (both date-only values)
export const isDateInYear = (year: Year, date: Date) =>
  !!year.StartDate && !!year.EndDate &&
  parseLocal(year.StartDate) <= date && date <= endOfDay(parseLocal(year.EndDate));

export const getCurrentYear = (years: Year[]) => {
  const today = new Date();
  return years.find((y) => isDateInYear(y, today));
};

export const isCurrentYear = (year: Year | null) => !!year && isDateInYear(year, new Date());

// The year's first counted day is the day after StartDate (quarters and session validation both use this)
export function getYearFirstDay(year: Year): Date {
  const d = parseLocal(year.StartDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns the quarters with their start and end dates along with quarter index.
// The year starts the day after StartDate; leftover days go to the last quarter.
export function getQuartersForYear(year: Year): [string, string, number][] {
  const startDay = getYearFirstDay(year);
  const endDay = parseLocal(year.EndDate);
  endDay.setHours(0, 0, 0, 0);
  if (isNaN(startDay.getTime()) || isNaN(endDay.getTime()) || endDay <= startDay) return [];

  // Inclusive day count (round, not floor: DST changes make a "day" 23 or 25 hours)
  const days = Math.round((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;
  const daysPerQuarter = Math.floor(days / 4);

  const quarters: [string, string, number][] = [];
  const current = new Date(startDay);
  for (let i = 0; i < 4; i++) {
    const qStart = new Date(current);
    qStart.setHours(0, 0, 1, 0);
    const qEnd = new Date(current);
    // Last quarter runs to the end of the year, picking up any remainder days
    qEnd.setDate(qEnd.getDate() + (i === 3 ? days - 3 * daysPerQuarter : daysPerQuarter) - 1);
    quarters.push([toLocalTimestamp(qStart), toLocalTimestamp(endOfDay(qEnd)), i + 1]);
    current.setTime(qEnd.getTime());
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }
  return quarters;
}
