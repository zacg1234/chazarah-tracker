import { supabase } from '@/services/supabaseClient';
import type { Obligation } from '@/types/obligation';
import { Year } from '@/types/year';
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
        // Provide sensible defaults for your app
        return {
            UserId,
            YearId,
            ObligationPerWeek: 0,
            // ...add any other required fields with defaults
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

type QuarterTurnOutRecord = {
    isActive: boolean;
    MinutesOwed: number;
    MinutesChazered: number;
    AmountPaid: number;
};

export async function getUserQuarterTurnOut(
  UserId: string,
  Year: Year,
  quarter: [string, string],
  obligation: Obligation
): Promise<QuarterTurnOutRecord> {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    // Future quarter: today is before quarter start
    if (todayStr < quarter[0]) {
        return {
            isActive: false,
            MinutesOwed: 0,
            MinutesChazered: 0,
            AmountPaid: 0
        };
    }

    // Set the quarter end date to today or quarter[1], whichever is earlier
    const effectiveEndStr = todayStr < quarter[1] ? todayStr : quarter[1];
    
    console.log(`Quarter Start Date: ${quarter[0]}`);
    console.log(`Quarter End Date: ${quarter[1]}`);
    console.log(`Effective End Date: ${effectiveEndStr}`);
    // Get sessions in this quarter
    const sessions = await getSessionsByUserBetweenDates(UserId, quarter[0], effectiveEndStr);
    console.log(`Sessions in Quarter: ${sessions.length}`);
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

    return {
        isActive: true,
        MinutesOwed: minutesOwed,
        MinutesChazered: totalMinutesChazered,
        AmountPaid: amountPaid
    };
}

export async function getUserQuarters(UserId: string, Year: Year): Promise<QuarterTurnOutRecord[]> { 
    // Get the user's weekly obligation
    const obligation = await getObligationByUserAndYear(UserId, Year.JewishYear);
    
    // Get the quarters from yearutils
    const quarters = getQuartersForYear(Year);

    const quarterTurnOuts = await Promise.all(
        quarters.map(q => getUserQuarterTurnOut(UserId, Year, q, obligation))
    );

    return quarterTurnOuts;
}