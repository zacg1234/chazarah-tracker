import { supabase } from '@/services/supabaseClient';
import type { Payment } from '@/types/payment';

// Get payments for a user between two dates (inclusive of both whole days)
export async function getPaymentsByUserBetweenDates(UserId: string, startDate: string, endDate: string): Promise<Payment[]> {
	const { data, error } = await supabase
		.from('TblPayment')
		.select('*')
		.eq('UserId', UserId)
		.gte('PaymentDate', `${startDate.slice(0, 10)} 00:00:00`)
		.lte('PaymentDate', `${endDate.slice(0, 10)} 23:59:59`)
		.order('PaymentDate', { ascending: true });
	if (error) throw error;
	return data as Payment[];
}
