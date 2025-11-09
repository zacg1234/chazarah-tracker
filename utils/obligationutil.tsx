import { supabase } from '@/services/supabaseClient';
import type { Obligation } from '@/types/obligation';
import type { QuarterTurnOut } from '@/types/QuarterTurnOut';
import { Year } from '@/types/year';
import { Alert } from 'react-native';
import { getSumPaymentsBetweenDates } from './paymentutil';
import { getSessionsByUserBetweenDates } from './sessionutil';
import { getQuartersForYear } from './yearutils';

// Get a user's obligation by userId and yearId
export async function getObligationByUserAndYear(UserId: string, YearId: number): Promise<Obligation> {
	const { data, error } = await supabase
		.from('TblObligation')
		.select('*')
		.eq('UserId', UserId)
		.eq('YearId', YearId)
		.maybeSingle();
	if (error) throw error;
	 if (!data) {
        Alert.alert('No Obligation Found', 'No Obligation was found for you for the selected year.');
        return {
            UserId,
            YearId,
            ObligationPerWeek: 0,
        } as Obligation;
    }
    return data as Obligation;
}


// Returns the number of weeks (can be fractional) between two dates (inclusive)
export function getWeeksBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    // Calculate days between two dates (inclusive)
    const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.floor((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
    return days / 7;
}



export async function getUserQuarterTurnOut(
  UserId: string,
  Year: Year,
  quarter: [string, string, number], // StartDate, EndDate, QuarterIndex
  obligation: Obligation
): Promise<QuarterTurnOut> {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    // Future quarter: today is before quarter start
    if (todayStr < quarter[0]) {
        return {
            QuarterIndex: quarter[2],
            QuarterStart: quarter[0],
            QuarterEnd: quarter[1],
            IsActive: false,
            MinutesOwed: 0,
            MinutesChazered: 0,
            AmountPaid: 0,
            FinalAmountOwed: 0
        };
    }

    // Set the quarter end date to today or quarter[1], whichever is earlier
    const effectiveEndStr = todayStr < quarter[1] ? todayStr : quarter[1];
    // Get sessions in this quarter
    const sessions = await getSessionsByUserBetweenDates(UserId, quarter[0], effectiveEndStr);
   
    let totalMinutesChazered = 0;
    for (const session of sessions) {
        totalMinutesChazered += session.SessionLength;
    }
    totalMinutesChazered = Math.floor(totalMinutesChazered / 60000);

    // Calculate obligation for the quarter
    const weeksInQuarter = getWeeksBetween(quarter[0], effectiveEndStr);
    const minutesOwed = obligation.ObligationPerWeek * weeksInQuarter;

    // Get amount paid in this quarter
    const amountPaid = await getSumPaymentsBetweenDates(UserId, quarter[0], effectiveEndStr);

    let finalAmountOwed = 0;
    if (todayStr > quarter[1]) {  // If the quarter has ended
        finalAmountOwed = minutesOwed - totalMinutesChazered - amountPaid;
    }

   return {
            QuarterIndex: quarter[2],
            QuarterStart: quarter[0],
            QuarterEnd: quarter[1],
            IsActive: true,
            MinutesOwed: minutesOwed,
            MinutesChazered: totalMinutesChazered,
            AmountPaid: amountPaid,
            FinalAmountOwed: finalAmountOwed
        };
};

export async function getUserQuarters(UserId: string, Year: Year): Promise<QuarterTurnOut[]> { 
    // Get the user's weekly obligation
    const obligation = await getObligationByUserAndYear(UserId, Year.JewishYear);
    
    // Get the quarters from yearutils
    const quarters = getQuartersForYear(Year);

    const quarterTurnOuts = await Promise.all(
        quarters.map(q => getUserQuarterTurnOut(UserId, Year, q, obligation))
    );

    // Sort by QuarterIndex
    quarterTurnOuts.sort((a, b) => a.QuarterIndex - b.QuarterIndex);
    return quarterTurnOuts;
}