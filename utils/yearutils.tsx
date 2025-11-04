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