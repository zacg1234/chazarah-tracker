import { supabase } from '@/services/supabaseClient';
import type { Obligation } from '@/types/obligation';
import type { QuarterTurnOut } from '@/types/QuarterTurnOut';
import type { Session } from '@/types/session';
import { Year } from '@/types/year';
import type { Payment } from '@/types/payment';
import { parseLocal, toDateString } from './dateutil';
import { getPaymentsByUserBetweenDates } from './paymentutil';
import { filterSessionsBetweenDates } from './sessionutil';
import { getQuartersForYear } from './yearutils';

// Get a user's obligation by userId and yearId
export async function getObligationByUserAndYear(UserId: string, YearId: number): Promise<Obligation | null> {
	const { data, error } = await supabase
		.from('TblObligation')
		.select('*')
		.eq('UserId', UserId)
		.eq('YearId', YearId)
		.maybeSingle();
	if (error) throw error;
	return (data as Obligation) ?? null;
}


// Returns the number of weeks (can be fractional) between two dates (inclusive of both days)
export function getWeeksBetween(startDate: string, endDate: string): number {
    const start = parseLocal(startDate);
    const end = parseLocal(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    // Compare calendar days (UTC of the local y/m/d) so DST can't skew the count
    const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
    return days / 7;
}

// Pure calculation for one quarter: no network access, payments are passed in
export function getUserQuarterTurnOut(
  quarter: [string, string, number], // StartDate, EndDate, QuarterIndex
  obligation: Obligation,
  sessions: Session[],
  payments: Payment[]
): QuarterTurnOut {
    const todayStr = toDateString(new Date());
    const [quarterStart, quarterEnd, quarterIndex] = quarter;
    const startDate = quarterStart.slice(0, 10);
    const endDate = quarterEnd.slice(0, 10);

    // Future quarter: today is before quarter start
    if (todayStr < startDate) {
        return {
            QuarterIndex: quarterIndex,
            QuarterStart: quarterStart,
            QuarterEnd: quarterEnd,
            IsActive: false,
            ObligationPerWeek: obligation.ObligationPerWeek,
            MinutesOwed: 0,
            MinutesChazered: 0,
            AmountPaid: 0,
            FinalAmountOwed: 0
        };
    }

    // The quarter counts up to today, or its last day if it has already ended
    const quarterEnded = todayStr > endDate;
    const effectiveEnd = quarterEnded ? endDate : todayStr;

    // Sessions in this quarter (whole days: start of first day through end of last)
    const filteredSessions = filterSessionsBetweenDates(sessions, startDate, effectiveEnd);
    const totalMs = filteredSessions.reduce((sum, s) => sum + s.SessionLength, 0);
    const minutesChazered = Math.floor(totalMs / 60000);

    // Obligation accrues weekly, prorated by day
    const minutesOwed = obligation.ObligationPerWeek * getWeeksBetween(startDate, effectiveEnd);

    // Payments dated within the quarter (PaymentDate may be a date or a full timestamp)
    const amountPaid = payments
        .filter((p) => {
            const d = p.PaymentDate?.slice(0, 10);
            return d >= startDate && d <= effectiveEnd;
        })
        .reduce((sum, p) => sum + (p.PaymentAmount || 0), 0);

    // Only settled once the quarter is over
    const finalAmountOwed = quarterEnded ? minutesOwed - minutesChazered - amountPaid : 0;

    return {
        QuarterIndex: quarterIndex,
        QuarterStart: quarterStart,
        QuarterEnd: quarterEnd,
        IsActive: true,
        ObligationPerWeek: obligation.ObligationPerWeek,
        MinutesOwed: minutesOwed,
        MinutesChazered: minutesChazered,
        AmountPaid: amountPaid,
        FinalAmountOwed: finalAmountOwed
    };
}

export async function getUserQuarters(UserId: string, Year: Year, sessions: Session[]): Promise<QuarterTurnOut[]> {
    const obligation = await getObligationByUserAndYear(UserId, Year.JewishYear);
    if (!obligation) return [];

    const quarters = getQuartersForYear(Year);
    if (quarters.length === 0) return [];

    // One payments query for the whole year instead of one per quarter
    const payments = await getPaymentsByUserBetweenDates(
        UserId,
        quarters[0][0].slice(0, 10),
        quarters[quarters.length - 1][1].slice(0, 10)
    );

    return quarters.map((q) => getUserQuarterTurnOut(q, obligation, sessions, payments));
}
