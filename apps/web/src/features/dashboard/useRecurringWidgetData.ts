import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { Account } from '@budgetos/database';

interface RecurringWidgetData {
  billsDueToday: Array<{ id: string; name: string; amount: number; type: string }>;
  upcomingBills: Array<{ id: string; name: string; amount: number; date: string; daysUntil: number }>;
  upcomingIncome: Array<{ id: string; name: string; amount: number; date: string; daysUntil: number }>;
  nextPaycheck: { name: string; amount: number; date: string; daysUntil: number } | null;
  upcomingSavingsTransfers: Array<{ id: string; name: string; amount: number; date: string }>;
  cashFlowForecast: Array<{ date: string; balance: number; netChange: number }>;
}

async function fetchRecurringWidgetData(userId: string): Promise<RecurringWidgetData> {
  requireUserId(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const [{ data: accounts }, { data: categories }, { data: recurrings }, { data: savings }, { data: mortgages }, { data: transactions }] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('categories').select('id, name').eq('user_id', userId),
    supabase.from('recurring_transactions').select('*').eq('user_id', userId),
    supabase.from('savings_goals').select('id, name, monthly_contribution').eq('user_id', userId),
    supabase.from('mortgages').select('id, name, principal, annual_rate, term_years, amortization_years, start_date, payment_frequency, compound_semi_annual, extra_payments, down_payment, purchase_price, is_active').eq('user_id', userId).eq('is_active', true),
    supabase.from('transactions').select('id, amount, date, merchant, category_id, account_id, recurring_id, is_archived').eq('user_id', userId),
  ]);

  const accts = (accounts ?? []) as Account[];
  const recs = recurrings ?? [];
  const savs = savings ?? [];
  const morts = mortgages ?? [];
  const txns = transactions ?? [];

  const mortgageResults = FinancialEngine.getMortgages(morts as any[], new Map());

  const events = FinancialEngine.getCalendarEvents(
    recs.map((r: any) => ({ id: r.id, name: r.name, amount: r.amount, type: r.type, frequency: r.frequency, next_run: r.next_run, status: r.status })),
    mortgageResults.map((m: any) => ({ id: m.id, name: m.name, monthlyPayment: m.monthlyPayment, paymentFrequency: m.paymentFrequency })),
    savs.map((g: any) => ({ id: g.id, name: g.name, monthlyContribution: Number(g.monthly_contribution ?? 0) })),
    txns.map((t: any) => ({ id: t.id, amount: t.amount, date: t.date, merchant: t.merchant, category_id: t.category_id, account_id: t.account_id, recurring_id: t.recurring_id, is_archived: t.is_archived })),
    year, month,
    accts.map((a) => ({ id: a.id, name: a.name })),
    (categories ?? []).map((c: any) => ({ id: c.id, name: c.name })),
    false,
  );

  const availableCash = FinancialEngine.getAvailableCash(accts);

  const [billsDueToday, upcomingBills, upcomingIncome, nextPaycheck, upcomingSavingsTransfers, cashFlowForecast] = await Promise.all([
    Promise.resolve(FinancialEngine.getBillsDueToday(
      recs.map((r: any) => ({ id: r.id, name: r.name, amount: r.amount, type: r.type, next_run: r.next_run, status: r.status })),
      mortgageResults.map((m: any) => ({ id: m.id, name: m.name, monthlyPayment: m.monthlyPayment, paymentFrequency: m.paymentFrequency, payoffDate: m.payoffDate, remainingBalance: m.remainingBalance, totalInterest: m.totalInterest, totalCost: m.totalCost, interestSaved: m.interestSaved, payoffMonths: m.payoffMonths, progressPct: m.progressPct, principalPaidPct: m.principalPaidPct, yearsRemaining: m.yearsRemaining, originalPrincipal: m.originalPrincipal })),
    )),
    Promise.resolve(FinancialEngine.getUpcomingBills(
      recs.map((r: any) => ({ id: r.id, name: r.name, amount: r.amount, type: r.type, next_run: r.next_run, status: r.status })),
      30,
    )),
    Promise.resolve(FinancialEngine.getUpcomingIncome(
      recs.map((r: any) => ({ id: r.id, name: r.name, amount: r.amount, type: r.type, next_run: r.next_run, status: r.status })),
      30,
    )),
    Promise.resolve(FinancialEngine.getNextPaycheck(
      recs.map((r: any) => ({ id: r.id, name: r.name, amount: r.amount, type: r.type, frequency: r.frequency, next_run: r.next_run, status: r.status })),
    )),
    Promise.resolve(FinancialEngine.getUpcomingSavingsTransfers(
      savs.map((g: any) => ({ id: g.id, name: g.name, monthlyContribution: Number(g.monthly_contribution ?? 0) })),
    )),
    Promise.resolve(FinancialEngine.getCashFlowForecast(events, availableCash, 30)),
  ]);

  return { billsDueToday, upcomingBills, upcomingIncome, nextPaycheck, upcomingSavingsTransfers, cashFlowForecast };
}

export function useRecurringWidgetData(userId: string | undefined) {
  return useQuery({
    queryKey: ['recurring-widgets', userId],
    queryFn: () => fetchRecurringWidgetData(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
