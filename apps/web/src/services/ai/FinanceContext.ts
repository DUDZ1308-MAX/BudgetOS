import type { AiContext } from '@/ai/types';
import { AccountRepository } from '@/lib/repositories/AccountRepository';
import { TransactionRepository } from '@/lib/repositories/TransactionRepository';
import { CategoryRepository } from '@/lib/repositories/CategoryRepository';
import { BudgetRepository } from '@/lib/repositories/BudgetRepository';
import { SavingsRepository } from '@/lib/repositories/SavingsRepository';
import { MortgageRepository } from '@/lib/repositories/MortgageRepository';
import { recurringApi } from '@/lib/api/recurring';
import { computeBudgetSummary } from '@/engine/BudgetEngine';
import { computeCashFlowSummary } from '@/engine/CashFlowEngine';
import { computeInsights } from '@/engine/insights/InsightEngine';
import { computeSafeToSpend } from '@/engine/safeToSpend/SafeToSpendEngine';
import { computeGoalStatus, computeSavingsDashboard } from '@/engine/SavingsEngine';
import { computeMortgage, computeMortgageDashboard } from '@/engine/MortgageEngine';
import { currentMonthRange, daysInMonth } from '@/engine/utils';
import { computeMonthlyRunRate } from '@budgetos/engine';
import type { RecurringFrequency } from '@budgetos/shared';
import type { EngineTransaction, EngineAccount, EngineCategory, EngineBudget } from '@/engine/types';

export async function buildAiContext(userId: string): Promise<AiContext> {
  const dateRange = currentMonthRange();
  const startDate = new Date(dateRange.start);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  const today = new Date();

  const [accounts, transactions, categories, budgets, savingsGoals, mortgages, recurrings] = await Promise.all([
    AccountRepository.getAll(userId),
    TransactionRepository.getAll(userId, { limit: 200 }),
    CategoryRepository.getAll(userId),
    BudgetRepository.getAll(userId, year, month),
    SavingsRepository.getAll(userId),
    MortgageRepository.getAll(userId),
    recurringApi.list(userId).catch(() => []),
  ]);

  const engineTransactions: EngineTransaction[] = (transactions ?? []).map((t) => ({
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
  }));

  const engineAccounts: EngineAccount[] = (accounts ?? []).map((a) => ({
    id: a.id,
    name: a.name ?? '',
    type: a.type ?? '',
    balance: Number(a.balance ?? 0),
    is_active: a.is_active ?? true,
    include_in_net_worth: a.include_in_net_worth ?? true,
    sort_order: a.sort_order ?? 0,
  }));

  const engineCategories: EngineCategory[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? '',
    type: c.type as 'income' | 'expense' | 'transfer' | 'saving',
    is_archived: c.is_archived ?? false,
  }));

  const engineBudgets: EngineBudget[] = (budgets ?? []).map((b) => ({
    id: b.id,
    category_id: b.category_id ?? '',
    year: b.year,
    month: b.month,
    amount: Number(b.amount ?? 0),
    rollover: b.rollover ?? false,
    month_key: b.month_key ?? `${b.year}-${String(b.month).padStart(2, '0')}`,
    rollover_enabled: b.rollover_enabled ?? false,
  }));

  const budgetSummary = computeBudgetSummary({
    transactions: engineTransactions,
    accounts: engineAccounts,
    categories: engineCategories,
    budgets: engineBudgets,
    dateRange,
  });

  const cashFlowSummary = computeCashFlowSummary({
    transactions: engineTransactions,
    accounts: engineAccounts,
  });

  const insights = computeInsights({
    budgetSummary,
    cashFlowSummary,
    dateRange,
  });

  const totalDays = daysInMonth(year, month);
  const daysRemaining = Math.max(0, totalDays - today.getDate() + 1);

  const safeToSpend = computeSafeToSpend({
    remainingBudget: budgetSummary.budgetStatus.totalRemaining,
    monthlyIncome: budgetSummary.income.total,
    daysRemaining,
    upcomingFixedExpenses: 0,
  });

  const activeMortgage = (mortgages ?? []).filter((m) => m.is_active)[0];
  let mortgageDashboard = null;
  let mortgageDetails = null;

  if (activeMortgage) {
    mortgageDetails = computeMortgage({
      principal: Number(activeMortgage.principal),
      annualRate: Number(activeMortgage.annual_rate),
      termYears: Number(activeMortgage.term_years),
      startDate: activeMortgage.start_date ?? new Date().toISOString().slice(0, 10),
      extraPayments: activeMortgage.extra_payment > 0
        ? [{ amount: Number(activeMortgage.extra_payment) }]
        : undefined,
    });

    if (mortgageDetails) {
      mortgageDashboard = computeMortgageDashboard(mortgageDetails);
    }
  }

  const goalStatuses = (savingsGoals ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    target: Number(g.target_amount),
    current: Number(g.current_amount),
    progress: computeGoalStatus(g),
  }));

  const savingsDashboard = computeSavingsDashboard(savingsGoals ?? []);

  const recurringSummary = (recurrings ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    amount: Number(r.amount),
    frequency: r.frequency,
    nextRun: r.next_run,
    status: r.status,
    autoPost: r.auto_post,
  }));

  // Compute frequency-normalized monthly run rate from active recurring definitions
  const activeRecurrings = (recurrings ?? []).filter((r) => r.status === 'active');
  const runRate = computeMonthlyRunRate(
    activeRecurrings.map((r) => ({
      amount: Math.abs(Number(r.amount)),
      frequency: r.frequency as RecurringFrequency,
      type: r.type as 'income' | 'expense',
    })),
  );

  // Use the higher of posted transactions or recurring run rate for monthly estimates
  const monthlyIncome = Math.max(budgetSummary.income.total, runRate.income);
  const monthlyExpenses = Math.max(budgetSummary.expenses.total, runRate.expenses);

  return {
    budgetSummary,
    cashFlowSummary,
    insights,
    alerts: budgetSummary.alerts,
    savings: {
      goals: goalStatuses,
      dashboard: savingsDashboard,
    },
    mortgage: {
      dashboard: mortgageDashboard,
      details: mortgageDetails,
    },
    safeToSpend,
    recentTransactions: engineTransactions.slice(0, 20),
    categories: engineCategories,
    netWorth: budgetSummary.accounts.netWorth,
    monthlyIncome,
    monthlyExpenses,
    recurringTransactions: recurringSummary,
  };
}
