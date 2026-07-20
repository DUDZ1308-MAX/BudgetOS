import { AccountRepository } from '@/lib/repositories/AccountRepository';
import { TransactionRepository } from '@/lib/repositories/TransactionRepository';
import { CategoryRepository } from '@/lib/repositories/CategoryRepository';
import { BudgetRepository } from '@/lib/repositories/BudgetRepository';
import { computeBudgetSummary } from '@/engine/BudgetEngine';
import { computeCashFlowSummary } from '@/engine/CashFlowEngine';
import { computeInsights } from '@/engine/insights/InsightEngine';
import { computeSafeToSpend } from '@/engine/safeToSpend/SafeToSpendEngine';
import { currentMonthRange, daysInMonth } from '@/engine/utils';
import type { EngineTransaction, EngineAccount, EngineCategory, EngineBudget } from '@/engine/types';
import type { DashboardData } from '@/types';

function getTodayDate(): Date {
  return new Date();
}

export const DashboardService = {
  async getDashboardData(userId: string): Promise<DashboardData> {
    const dateRange = currentMonthRange();
    const startDate = new Date(dateRange.start);
    const today = getTodayDate();
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;

    const [accounts, transactions, categories, budgets] = await Promise.all([
      AccountRepository.getAll(userId),
      TransactionRepository.getAll(userId, { limit: 50 }),
      CategoryRepository.getAll(userId),
      BudgetRepository.getAll(userId, year, month),
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

    const accountNames: Record<string, string> = {};
    const accountsSummary = engineAccounts.map((a) => {
      accountNames[a.id] = a.name;
      return { id: a.id, name: a.name, type: a.type, balance: a.balance };
    });

    const categoryNames: Record<string, string> = {};
    for (const cat of engineCategories) {
      categoryNames[cat.id] = cat.name;
    }

    const transactionsSummary = engineTransactions.slice(0, 10).map((t) => ({
      id: t.id,
      amount: t.amount,
      merchant: t.merchant ?? '',
      date: t.date,
      categoryName: t.category_id ? (categoryNames[t.category_id] ?? '') : '',
      accountName: t.account_id ? (accountNames[t.account_id] ?? null) : null,
    }));

    return {
      stats: {
        netWorth: budgetSummary.accounts.netWorth,
        monthlyIncome: budgetSummary.income.total,
        monthlyExpenses: budgetSummary.expenses.total,
        remainingCash: budgetSummary.accounts.remainingCash,
        accountCount: budgetSummary.accounts.accountCount,
      },
      accounts: accountsSummary,
      recentTransactions: transactionsSummary,
      insights,
      safeToSpend,
    };
  },
};
