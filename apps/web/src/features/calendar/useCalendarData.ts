import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { Account } from '@budgetos/database';
import type { CalendarEvent, DailyForecast, MonthlyForecast } from '@/lib/dashboard/types';

interface CalendarData {
  events: CalendarEvent[];
  forecast: DailyForecast[];
  monthlyForecast: MonthlyForecast;
  availableCash: number;
  netWorth: number;
}

async function fetchCalendarData(userId: string, year: number, month: number, forecastDays: number = 60): Promise<CalendarData> {
  const [
    { data: accounts },
    { data: categories },
    { data: transactions },
    { data: recurrings },
    { data: savings },
    { data: mortgages },
  ] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('categories').select('id, name, type').eq('user_id', userId),
    supabase.from('transactions').select('id, amount, date, merchant, category_id, account_id, recurring_id, is_archived').eq('user_id', userId),
    supabase.from('recurring_transactions').select('id, name, amount, type, frequency, next_run, status').eq('user_id', userId),
    supabase.from('savings_goals').select('id, name, monthly_contribution').eq('user_id', userId),
    supabase.from('mortgages').select('id, name, monthly_payment, payment_frequency, is_active').eq('user_id', userId).eq('is_active', true),
  ]);

  const accts = (accounts ?? []) as Account[];
  const cats = categories ?? [];
  const txns = transactions ?? [];
  const recs = recurrings ?? [];
  const savs = savings ?? [];
  const morts = mortgages ?? [];

  const events = FinancialEngine.getCalendarEvents(
    recs.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      next_run: r.next_run,
      status: r.status,
    })),
    morts.map((m: any) => ({
      id: m.id,
      name: m.name,
      monthlyPayment: Number(m.monthly_payment),
      paymentFrequency: m.payment_frequency,
    })),
    savs.map((g: any) => ({
      id: g.id,
      name: g.name,
      monthlyContribution: Number(g.monthly_contribution ?? 0),
    })),
    txns.map((t: any) => ({
      id: t.id,
      amount: t.amount,
      date: t.date,
      merchant: t.merchant,
      category_id: t.category_id,
      account_id: t.account_id,
      recurring_id: t.recurring_id,
      is_archived: t.is_archived,
    })),
    year, month,
    accts.map((a) => ({ id: a.id, name: a.name })),
    cats.map((c: any) => ({ id: c.id, name: c.name })),
    true,
  );

  const availableCash = FinancialEngine.getAvailableCash(accts);
  const forecast = FinancialEngine.getDailyForecast(events, availableCash, forecastDays);
  const netWorthResult = FinancialEngine.getNetWorth(accts);
  const monthlyForecast = FinancialEngine.getMonthlyForecast(events, netWorthResult.netWorth, availableCash, year, month);

  return { events, forecast, monthlyForecast, availableCash, netWorth: netWorthResult.netWorth };
}

export function useCalendarData(userId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ['calendar-data', userId, year, month],
    queryFn: () => fetchCalendarData(userId!, year, month),
    enabled: !!userId,
  });
}
