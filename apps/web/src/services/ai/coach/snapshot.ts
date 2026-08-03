import { requireUserId } from '@/lib/auth';
import { FinancialEngine } from '@/services/FinancialEngine';
import { fetchForecastData } from '@/services/forecast/forecastData';
import { computeBudgetSummary } from '@/engine/BudgetEngine';
import { transactionsApi, categoriesApi, accountsApi, mortgageApi, savingsApi } from '@/lib/api';
import type { EngineAccount, EngineBudget, EngineCategory, EngineTransaction } from '@/engine/types';
import type { DateRange } from '@/services/FinancialEngine';
import type { CoachSnapshotData, MonthSpending } from './types';

// ============================================================================
// Financial Context Builder (Phase 2)
//
// Builds a single authoritative financial snapshot for the authenticated user.
// Every value is produced by the Financial Engine / Forecasting Engine — the
// AI Coach never calculates financial values itself.
//
// SECURITY (Phase 3):
//  - requireUserId enforces a real authenticated UUID before any fetch.
//  - Every repository/API call is scoped to that userId.
//  - No passwords, tokens, API keys, or service-role credentials ever enter
//    this snapshot — only aggregated financial figures and minimal merchant
//    names required to answer spending questions.
// ============================================================================

export function toEngineTransaction(t: Record<string, any>): EngineTransaction {
  return {
    id: t.id,
    account_id: t.account_id,
    category_id: t.category_id,
    amount: Number(t.amount ?? 0),
    date: t.date ?? '',
    merchant: t.merchant,
    note: t.note,
    is_archived: t.is_archived ?? false,
    is_recurring: t.is_recurring ?? false,
    is_pending: t.is_pending ?? false,
    recurring_id: t.recurring_id ?? null,
    currency: t.currency ?? null,
    description: t.description ?? null,
    notes: t.notes ?? null,
    tags: t.tags ?? null,
  };
}

export function toEngineAccount(a: Record<string, any>): EngineAccount {
  return {
    id: a.id,
    name: a.name ?? '',
    type: a.type ?? '',
    balance: Number(a.balance ?? 0),
    is_active: a.is_active ?? true,
    include_in_net_worth: a.include_in_net_worth ?? true,
    sort_order: a.sort_order ?? 0,
  };
}

export function toEngineCategory(c: Record<string, any>): EngineCategory {
  return {
    id: c.id,
    name: c.name ?? '',
    type: (c.type ?? 'expense') as EngineCategory['type'],
    is_archived: c.is_archived ?? false,
  };
}

function monthRange(date: Date): DateRange {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function previousMonthRange(date: Date): DateRange {
  const firstOfPrev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthRange(firstOfPrev);
}

const EMPTY_BUDGETS: EngineBudget[] = [];

/**
 * Authoritative per-category spending for a given month, delegated to the
 * Budget Engine (computeBudgetSummary) so the Coach reuses the SSOT instead of
 * recomputing totals itself.
 */
export async function buildMonthSpending(
  userId: string,
  range: DateRange,
  asOfDate: Date,
): Promise<MonthSpending> {
  const [txns, categories, accounts] = await Promise.all([
    transactionsApi.list(userId, { dateFrom: range.start, dateTo: range.end }),
    categoriesApi.list(userId),
    accountsApi.list(userId),
  ]);

  const summary = computeBudgetSummary({
    transactions: (txns ?? []).map(toEngineTransaction),
    accounts: (accounts ?? []).map(toEngineAccount),
    categories: (categories ?? []).map(toEngineCategory),
    budgets: EMPTY_BUDGETS,
    dateRange: range,
  });

  return {
    label: range.start.slice(0, 7),
    startDate: range.start,
    endDate: range.end,
    income: summary.income.total,
    expenses: summary.expenses.total,
    byCategory: summary.expenses.byCategory,
  };
}

export async function buildFinancialSnapshot(userId: string): Promise<CoachSnapshotData> {
  requireUserId(userId);

  const now = new Date();
  const asOfDate = now.toISOString().slice(0, 10);
  const currentRange = monthRange(now);
  const previousRange = previousMonthRange(now);

  const [dashboard, forecast, historical, currentMonth, previousMonth] = await Promise.all([
    FinancialEngine.getDashboardData(userId),
    fetchForecastData(userId),
    FinancialEngine.getHistoricalCashFlow(userId, 6),
    buildMonthSpending(userId, currentRange, now),
    buildMonthSpending(userId, previousRange, now),
  ]);

  // Raw mortgage data (needed only for read-only what-if projections) plus the
  // extra payments already recorded for the account.
  const activeRawMortgages = dashboard.mortgages.map((m) => m).length > 0
    ? await mortgageApi.list(userId)
    : [];
  const rawMortgages = await Promise.all(
    (activeRawMortgages ?? []).filter((m) => m.is_active).map(async (m) => {
      let extraPayments: Array<{ amount: number; date: string; type?: string }> = [];
      try {
        const extras = await mortgageApi.listExtraPayments(m.id);
        extraPayments = (extras ?? []).map((e) => ({
          amount: Number(e.amount),
          date: e.date,
          type: e.type,
        }));
      } catch {
        extraPayments = [];
      }
      return {
        id: m.id,
        name: m.name,
        principal: Number(m.principal),
        annualRate: Number(m.annual_rate),
        termYears: Number(m.term_years),
        amortizationYears: m.amortization_years ? Number(m.amortization_years) : null,
        startDate: m.start_date ?? asOfDate,
        paymentFrequency: m.payment_frequency,
        extraPayments,
      };
    }),
  );

  const unavailableSources = Array.from(new Set([
    ...dashboard.errors,
    ...(historical.length === 0 ? ['historical'] : []),
  ]));

  // Raw savings goals (needed only for read-only savings what-if projections;
  // dashboard.savingsGoals omits the monthly contribution figure).
  const rawSavings = (await savingsApi.list(userId))
    .filter((g) => !g.is_completed)
    .map((g) => ({
      id: g.id,
      name: g.name,
      currentAmount: Number(g.current_amount ?? 0),
      targetAmount: Number(g.target_amount ?? 0),
      monthlyContribution: Number(g.monthly_contribution ?? 0),
      targetDate: g.target_date ?? null,
    }));

  return {
    asOfDate,
    dashboard,
    forecast,
    currentMonth,
    previousMonth,
    historical,
    rawMortgages,
    rawSavings,
    unavailableSources,
  };
}
