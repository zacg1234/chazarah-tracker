import { supabase } from '@/services/supabaseClient';
import type { Payment } from '@/types/payment';


// Get payments for a user between two dates (inclusive)
export async function getPaymentsByUserBetweenDates(UserId: string, startDate: string, endDate: string): Promise<Payment[]> {
	const { data, error } = await supabase
		.from('TblPayment')
		.select('*')
		.eq('UserId', UserId)
		.gte('PaymentDate', startDate)
		.lte('PaymentDate', endDate)
		.order('PaymentDate', { ascending: true });
	if (error) throw error;
	return data as Payment[];
}

// Returns the total payment amount for a user between two dates (inclusive)
export async function getSumPaymentsBetweenDates(UserId: string, startDate: string, endDate: string): Promise<number> {
	const payments = await getPaymentsByUserBetweenDates(UserId, startDate, endDate);
	return payments.reduce((sum, p) => sum + (p.PaymentAmount || 0), 0);
}