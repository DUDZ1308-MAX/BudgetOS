import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';
import { FinancialEngine } from '@/services/FinancialEngine';
import { computeCashFlowForecast } from '@/services/ForecastService';
import type { CashFlowForecast } from '@/lib/forecast/types';
import type { Account } from '@budgetos/database';

/**
 * Builds the authoritative 30/60/90-day cash flow forecast for the
 * authenticated user. Shared by the calendar page and the AI Financial Coach
 * so both surfaces use the exact same Forecast Engine results.
 *
 * SECURITY: the userId must be a real authenticated Supabase UUID. requireUserId
 * throws for null/empty/non-UUID values before any query is issued, and every
 * query is scoped with eq('user_id', userId) so a user can only ever see their
 * own data (RLS is the final enforcement boundary).
 */
export async function fetchForecastData(userId: string): Promise<CashFlowForecast> {
  requireUserId(userId);
  const [
    { data: accounts },
    { data: categories },
    { data: transactions },
    { data: recurrings },
    { data: savings },
    { data: mortgages },
  ] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('categories').select('id, name').eq('user_id', userId),
    supabase.from('transactions').select('id, amount, date, merchant, category_id, account_id, recurring_id, is_archived').eq('user_id', userId),
    supabase.from('recurring_transactions').select('*').eq('user_id', userId),
    supabase.from('savings_goals').select('id, name, monthly_contribution, is_completed').eq('user_id', userId),
    supabase.from('mortgages').select('id, name, principal, annual_rate, term_years, amortization_years, start_date, payment_frequency, compound_semi_annual, extra_payments, down_payment, purchase_price, is_active').eq('user_id', userId),
  ]);

  const accts = (accounts ?? []) as Account[];
  const mortgageResults = FinancialEngine.getMortgages((mortgages ?? []) as any[], new Map());
  const mortgageMap = new Map((mortgages ?? []).map((m: any) => [m.id, m]));

  return computeCashFlowForecast({
    availableCash: FinancialEngine.getAvailableCash(accts),
    transactions: (transactions ?? []).map((t: any) => ({
      id: t.id,
      amount: Number(t.amount),
      date: t.date,
      merchant: t.merchant,
      categoryId: t.category_id,
      accountId: t.account_id,
      recurringId: t.recurring_id,
      isArchived: t.is_archived,
    })),
    recurrings: (recurrings ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      type: r.type,
      frequency: r.frequency,
      intervalCount: r.interval_count ?? 1,
      dayOfWeek: r.day_of_week,
      dayOfMonth: r.day_of_month,
      monthOfYear: r.month_of_year,
      startDate: r.start_date,
      endDate: r.end_date,
      nextRun: r.next_run,
      lastRun: r.last_run,
      status: r.status,
    })),
    savingsGoals: (savings ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      monthlyContribution: Number(g.monthly_contribution ?? 0),
      isCompleted: !!g.is_completed,
    })),
    mortgages: mortgageResults.map((m: any) => ({
      id: m.id,
      name: m.name,
      monthlyPayment: Number(m.monthlyPayment ?? 0),
      paymentFrequency: m.paymentFrequency ?? 'monthly',
      remainingBalance: Number(m.remainingBalance ?? 0),
      startDate: mortgageMap.get(m.id)?.start_date ?? null,
    })),
    categories: (categories ?? []).map((c: any) => ({ id: c.id, name: c.name })),
  });
}
