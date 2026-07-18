import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { categoriesApi } from '@/lib/api/categories';
import { budgetsApi } from '@/lib/api/budgets';
import { recurringApi } from '@/lib/api/recurring';
import { savingsApi } from '@/lib/api/savings';
import { mortgageApi } from '@/lib/api/mortgage';
import {
  computeMonthlyRunRate,
  computeBudgetSummary,
  computeHealthScore,
  computeGoalProgress,
} from '@budgetos/engine';
import {
  computeMortgage as computeMortgageEngine,
  computeMortgageDashboard as computeMortgageDashboardEngine,
} from '@/engine/MortgageEngine';
import type { RecurringFrequency, FHSRequest, CategoryBudget, TransactionSummary } from '@budgetos/shared';
import type { Account, Category, Budget, Transaction, SavingsGoal, Mortgage } from '@budgetos/database';

// ============================================================================
// FinancialEngine — Single Source of Truth for ALL Financial Calculations
// ============================================================================
//
// RULE: Every financial value displayed in the application MUST originate from
// this service. No dashboard card, report, or page may calculate financial
// values independently. All calculations delegate to @budgetos/engine.
//
// Architecture:
//   Database (Supabase) → API Layer → FinancialEngine → @budgetos/engine → UI
//
// This service is responsible for:
// 1. Fetching raw data from the API layer
// 2. Transforming it into engine-compatible formats
// 3. Calling engine functions (the ONLY place calculations happen)
// 4. Returning typed results
// ============================================================================

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[FinancialEngine] ${method}`, ...args);
}

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start: string;
  end: string;
}

export interface NetWorthResult {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  accounts: Account[];
}

export interface CashFlowResult {
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  income: number;
  expenses: number;
}

export interface BudgetHealthResult {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    status: string;
  }>;
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  adherencePercent: number;
  overallStatus: string;
}

export interface FinancialHealthResult {
  overallScore: number;
  tier: string;
  components: Record<string, { maxPoints: number; earnedPoints: number; percentage: number; details: string }>;
  recommendations: string[];
}

export interface SavingsGoalResult {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string | null;
  percentComplete: number;
  monthsRemaining: number | null;
  onTrack: boolean;
  estimatedCompletionDate: string | null;
}

export interface MortgageResult {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingBalance: number;
  totalInterest: number;
  totalCost: number;
  interestSaved: number;
  payoffDate: string;
  payoffMonths: number;
  progressPct: number;
  principalPaidPct: number;
}

export interface UpcomingActivityResult {
  id: string;
  name: string;
  amount: number;
  nextRun: string;
  type: 'income' | 'expense';
  frequency: string;
}

export interface DashboardData {
  netWorth: NetWorthResult;
  cashFlow: CashFlowResult;
  budgetHealth: BudgetHealthResult;
  financialHealth: FinancialHealthResult;
  savingsGoals: SavingsGoalResult[];
  mortgages: MortgageResult[];
  upcomingActivity: UpcomingActivityResult[];
  topSpendingCategories: Array<{ categoryName: string; amount: number }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    date: string;
    merchant: string | null;
    categoryName: string | null;
    accountName: string | null;
  }>;
  errors: string[];
}

// ============================================================================
// Data Fetching Helpers
// ============================================================================

function currentMonthRange(): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

async function fetchAllData(userId: string) {
  const range = currentMonthRange();

  const [
    accountsResult,
    categoriesResult,
    budgetsResult,
    transactionsResult,
    recurringsResult,
    savingsResult,
    mortgagesResult,
  ] = await Promise.allSettled([
    accountsApi.list(userId),
    categoriesApi.list(userId),
    budgetsApi.list(userId, new Date().getFullYear(), new Date().getMonth() + 1),
    transactionsApi.list(userId, { dateFrom: range.start, dateTo: range.end }),
    recurringApi.list(userId),
    savingsApi.list(userId),
    mortgageApi.list(userId),
  ]);

  const errors: string[] = [];

  if (accountsResult.status === 'rejected') { debug('accounts fetch failed', accountsResult.reason); errors.push('accounts'); }
  if (categoriesResult.status === 'rejected') { debug('categories fetch failed', categoriesResult.reason); errors.push('categories'); }
  if (budgetsResult.status === 'rejected') { debug('budgets fetch failed (non-critical)', budgetsResult.reason); }
  if (transactionsResult.status === 'rejected') { debug('transactions fetch failed', transactionsResult.reason); errors.push('transactions'); }
  if (recurringsResult.status === 'rejected') { debug('recurrings fetch failed', recurringsResult.reason); errors.push('recurrings'); }
  if (savingsResult.status === 'rejected') { debug('savings fetch failed', savingsResult.reason); errors.push('savings'); }
  if (mortgagesResult.status === 'rejected') { debug('mortgages fetch failed', mortgagesResult.reason); errors.push('mortgages'); }

  return {
    accounts: accountsResult.status === 'fulfilled' ? accountsResult.value : [],
    categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
    budgets: budgetsResult.status === 'fulfilled' ? budgetsResult.value : [],
    transactions: transactionsResult.status === 'fulfilled' ? transactionsResult.value : [],
    recurrings: recurringsResult.status === 'fulfilled' ? recurringsResult.value : [],
    savings: savingsResult.status === 'fulfilled' ? savingsResult.value : [],
    mortgages: mortgagesResult.status === 'fulfilled' ? mortgagesResult.value : [],
    errors,
    range,
  };
}

// ============================================================================
// Core Calculation Methods — ALL delegate to @budgetos/engine
// ============================================================================

const LIABILITY_TYPES = new Set(['credit', 'credit_card', 'loan']);

export const FinancialEngine = {
  // -------------------------------------------------------------------------
  // Net Worth
  // -------------------------------------------------------------------------
  getNetWorth(accounts: Account[]): NetWorthResult {
    const activeAccounts = accounts.filter(
      (a) => a.is_active && (a as any).include_in_net_worth !== false,
    );

    // Net Worth = sum of all active account balances
    const netWorth = activeAccounts.reduce((sum, a) => sum + Number(a.balance ?? 0), 0);

    // Assets = sum of positive balances from non-liability accounts
    const totalAssets = activeAccounts
      .filter((a) => !LIABILITY_TYPES.has(a.type))
      .reduce((sum, a) => sum + Math.max(0, Number(a.balance ?? 0)), 0);

    // Liabilities = sum of absolute balances from liability accounts
    const totalLiabilities = activeAccounts
      .filter((a) => LIABILITY_TYPES.has(a.type))
      .reduce((sum, a) => sum + Math.abs(Number(a.balance ?? 0)), 0);

    return { netWorth, totalAssets, totalLiabilities, accounts: activeAccounts };
  },

  // -------------------------------------------------------------------------
  // Cash Flow — uses engine's computeMonthlyRunRate for recurring items
  // -------------------------------------------------------------------------
  getCashFlow(
    transactions: Transaction[],
    recurrings: Array<{ amount: number; frequency: string; type: string; status: string }>,
    dateRange: DateRange,
  ): CashFlowResult {
    // Sum posted transactions for the current month
    let postedIncome = 0;
    let postedExpenses = 0;

    for (const txn of transactions) {
      const amount = Math.abs(Number(txn.amount ?? 0));
      if (txn.amount > 0) {
        postedIncome += amount;
      } else {
        postedExpenses += amount;
      }
    }

    // Compute frequency-normalized monthly run rate from active recurring definitions
    const activeRecurrings = recurrings.filter((r) => r.status === 'active');
    const runRate = computeMonthlyRunRate(
      activeRecurrings.map((r) => ({
        amount: Math.abs(Number(r.amount)),
        frequency: r.frequency as RecurringFrequency,
        type: r.type as 'income' | 'expense',
      })),
    );

    // Use the higher of posted transactions or recurring run rate for monthly estimates
    // This ensures early-in-month views show expected monthly totals from recurring items
    const monthlyIncome = Math.max(postedIncome, runRate.income);
    const monthlyExpenses = Math.max(postedExpenses, runRate.expenses);
    const cashFlow = monthlyIncome - monthlyExpenses;

    return {
      monthlyIncome,
      monthlyExpenses,
      cashFlow,
      income: postedIncome,
      expenses: postedExpenses,
    };
  },

  // -------------------------------------------------------------------------
  // Budget Health — uses engine's computeBudgetSummary
  // -------------------------------------------------------------------------
  getBudgetHealth(
    budgets: Budget[],
    transactions: Transaction[],
    categories: Category[],
    totalIncome: number,
  ): BudgetHealthResult {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Sum expenses by category from transactions
    const categorySpending = new Map<string, number>();
    for (const txn of transactions) {
      if (!txn.category_id) continue;
      const amount = Math.abs(Number(txn.amount ?? 0));
      categorySpending.set(txn.category_id, (categorySpending.get(txn.category_id) ?? 0) + amount);
    }

    // Transform budgets into engine-compatible format
    const engineBudgets: CategoryBudget[] = budgets.map((b) => ({
      categoryId: b.category_id ?? '',
      amount: Number(b.amount ?? 0),
      percentage: null,
      rolloverEnabled: (b as any).rollover_enabled ?? (b as any).rollover ?? false,
    }));

    const engineTransactions: TransactionSummary[] = Array.from(categorySpending.entries()).map(
      ([categoryId, totalAmount]) => ({ categoryId, totalAmount: -totalAmount }),
    );

    // Use engine's computeBudgetSummary
    const result = computeBudgetSummary({
      budgets: engineBudgets,
      transactions: engineTransactions,
      previousMonthRollovers: [],
      totalIncome,
    });

    return {
      categories: result.categories.map((c) => {
        const cat = categoryMap.get(c.categoryId);
        return {
          categoryId: c.categoryId,
          categoryName: cat?.name ?? 'Unknown',
          budgeted: c.budgeted,
          spent: c.spent,
          remaining: c.available,
          percentUsed: c.percentUsed,
          status: c.status,
        };
      }),
      totalBudgeted: result.overall.totalBudgeted,
      totalSpent: result.overall.totalSpent,
      remaining: result.overall.remaining,
      adherencePercent: result.overall.adherencePercent,
      overallStatus: result.overall.status,
    };
  },

  // -------------------------------------------------------------------------
  // Financial Health Score — uses engine's computeHealthScore
  // -------------------------------------------------------------------------
  getFinancialHealthScore(
    cashFlow: CashFlowResult,
    netWorth: NetWorthResult,
    budgetHealth: BudgetHealthResult,
    savingsRate: number,
    monthlyExpenses: number,
  ): FinancialHealthResult {
    // Calculate debt payments (monthly minimums from liability accounts)
    const totalDebtPaymentsMonthly = 0; // TODO: Track actual minimum payments

    // Calculate net worth 3 months ago (placeholder — needs historical data)
    const netWorthThreeMonthsAgo = netWorth.netWorth; // TODO: Store historical snapshots

    const request: FHSRequest = {
      totalIncomeMonthly: cashFlow.monthlyIncome,
      totalSavingsMonthly: cashFlow.monthlyIncome * (savingsRate / 100),
      totalDebtPaymentsMonthly,
      emergencyFundBalance: netWorth.totalAssets,
      monthlyExpenses,
      budgets: budgetHealth.categories.map((c) => ({
        categoryId: c.categoryId,
        budgeted: c.budgeted,
      })),
      actualSpending: budgetHealth.categories.map((c) => ({
        categoryId: c.categoryId,
        spent: c.spent,
      })),
      currentNetWorth: netWorth.netWorth,
      netWorthThreeMonthsAgo,
    };

    const result = computeHealthScore(request);

    return {
      overallScore: result.overallScore,
      tier: result.tier,
      components: result.components,
      recommendations: result.recommendations,
    };
  },

  // -------------------------------------------------------------------------
  // Savings Goals — uses engine's computeGoalProgress
  // -------------------------------------------------------------------------
  getSavingsGoals(goals: SavingsGoal[]): SavingsGoalResult[] {
    return goals.map((goal) => {
      const result = computeGoalProgress({
        currentAmount: Number(goal.current_amount ?? 0),
        targetAmount: Number(goal.target_amount ?? 0),
        targetDate: goal.target_date ?? '',
        monthlyContribution: Number((goal as any).monthly_contribution ?? 0),
      });

      return {
        id: goal.id,
        name: goal.name,
        currentAmount: Number(goal.current_amount ?? 0),
        targetAmount: Number(goal.target_amount ?? 0),
        targetDate: goal.target_date ?? null,
        percentComplete: result.percentComplete,
        monthsRemaining: result.monthsRemaining,
        onTrack: result.onTrack,
        estimatedCompletionDate: result.estimatedCompletionDate,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Mortgage — uses MortgageEngine (same as Mortgage Page)
  // -------------------------------------------------------------------------
  getMortgages(
    mortgages: Mortgage[],
    extraPaymentsMap?: Map<string, Array<{ amount: number; date: string; type?: string }>>,
  ): MortgageResult[] {
    return mortgages
      .filter((m) => m.is_active)
      .map((m) => {
        const extraPayments = (extraPaymentsMap?.get(m.id) ?? []).map((ep) => {
          const startDate = new Date(m.start_date ?? new Date().toISOString().slice(0, 10));
          const epDate = new Date(ep.date);
          const monthsSinceStart = (epDate.getFullYear() - startDate.getFullYear()) * 12 + (epDate.getMonth() - startDate.getMonth());
          const startMonth = Math.max(1, monthsSinceStart + 1);
          return {
            amount: Number(ep.amount),
            type: (ep.type as any) ?? 'one_time',
            startMonth,
          };
        });

        const calcResult = computeMortgageEngine({
          principal: Number(m.principal ?? 0),
          annualRate: Number(m.annual_rate ?? 0),
          termYears: Number(m.term_years ?? 0),
          amortizationYears: Number((m as any).amortization_years ?? m.term_years),
          startDate: m.start_date ?? new Date().toISOString().slice(0, 10),
          paymentFrequency: ((m as any).payment_frequency ?? 'monthly') as string,
          compoundSemiAnnual: (m as any).compound_semi_annual ?? true,
          extraPayments,
        });

        if (!calcResult) {
          debug('mortgage calculation failed for', m.id);
          return {
            id: m.id,
            name: m.name,
            monthlyPayment: 0,
            remainingBalance: Number(m.principal ?? 0),
            totalInterest: 0,
            totalCost: Number(m.principal ?? 0),
            interestSaved: 0,
            payoffDate: '',
            payoffMonths: Number(m.term_years ?? 0) * 12,
            progressPct: 0,
            principalPaidPct: 0,
          };
        }

        const dashboard = computeMortgageDashboardEngine(calcResult);
        const principalPaidPct = calcResult.totalPrincipal > 0
          ? Math.min(100, (dashboard.principalPaid / calcResult.totalPrincipal) * 100)
          : 0;

        return {
          id: m.id,
          name: m.name,
          monthlyPayment: dashboard.monthlyPayment,
          remainingBalance: dashboard.remainingBalance,
          totalInterest: calcResult.totalInterest,
          totalCost: calcResult.totalPrincipal + calcResult.totalInterest,
          interestSaved: calcResult.interestSaved,
          payoffDate: dashboard.payoffDate ?? '',
          payoffMonths: calcResult.payoffMonths,
          progressPct: dashboard.progressPct,
          principalPaidPct,
        };
      });
  },

  getMortgageSchedule(m: Mortgage): { month: number; remainingBalance: number; payment: number; principal: number; interest: number }[] {
    const calcResult = computeMortgageEngine({
      principal: Number(m.principal ?? 0),
      annualRate: Number(m.annual_rate ?? 0),
      termYears: Number(m.term_years ?? 0),
      amortizationYears: Number((m as any).amortization_years ?? m.term_years),
      startDate: m.start_date ?? new Date().toISOString().slice(0, 10),
      paymentFrequency: ((m as any).payment_frequency ?? 'monthly') as string,
      compoundSemiAnnual: (m as any).compound_semi_annual ?? true,
      extraPayments: [],
    });
    if (!calcResult) return [];
    return calcResult.schedule;
  },

  // -------------------------------------------------------------------------
  // Upcoming Activity — recurring transactions due soon
  // -------------------------------------------------------------------------
  getUpcomingActivity(
    recurrings: Array<{
      id: string;
      name: string;
      amount: number;
      type: string;
      frequency: string;
      next_run: string;
      status: string;
    }>,
  ): UpcomingActivityResult[] {
    return recurrings
      .filter((r) => r.status === 'active')
      .sort((a, b) => new Date(a.next_run).getTime() - new Date(b.next_run).getTime())
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        name: r.name,
        amount: Math.abs(Number(r.amount)),
        nextRun: r.next_run,
        type: r.type as 'income' | 'expense',
        frequency: r.frequency,
      }));
  },

  // -------------------------------------------------------------------------
  // Historical Cash Flow — last N months for trend chart
  // -------------------------------------------------------------------------
  async getHistoricalCashFlow(
    userId: string,
    months: number = 6,
  ): Promise<Array<{ month: string; income: number; expenses: number; net: number }>> {
    const results: Array<{ month: string; income: number; expenses: number; net: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const lastDay = new Date(year, month, 0).getDate();
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });

      try {
        const [txns, recurrings] = await Promise.all([
          transactionsApi.list(userId, { dateFrom: start, dateTo: end }),
          recurringApi.list(userId),
        ]);

        const result = FinancialEngine.getCashFlow(txns, recurrings, { start, end });
        results.push({
          month: monthLabel,
          income: result.monthlyIncome,
          expenses: result.monthlyExpenses,
          net: result.cashFlow,
        });
      } catch {
        results.push({ month: monthLabel, income: 0, expenses: 0, net: 0 });
      }
    }

    return results;
  },

  // -------------------------------------------------------------------------
  // Full Dashboard Data — single call that computes everything
  // -------------------------------------------------------------------------
  async getDashboardData(userId: string): Promise<DashboardData> {
    debug('getDashboardData', userId);

    const {
      accounts,
      categories,
      budgets,
      transactions,
      recurrings,
      savings,
      mortgages,
      errors,
      range,
    } = await fetchAllData(userId);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    // 1. Net Worth
    const netWorth = FinancialEngine.getNetWorth(accounts);

    // 2. Cash Flow
    const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, range);

    // 3. Budget Health
    const budgetHealth = FinancialEngine.getBudgetHealth(
      budgets,
      transactions,
      categories,
      cashFlow.monthlyIncome,
    );

    // 4. Financial Health Score
    const savingsRate = cashFlow.monthlyIncome > 0
      ? ((cashFlow.monthlyIncome - cashFlow.monthlyExpenses) / cashFlow.monthlyIncome) * 100
      : 0;
    const financialHealth = FinancialEngine.getFinancialHealthScore(
      cashFlow,
      netWorth,
      budgetHealth,
      savingsRate,
      cashFlow.monthlyExpenses,
    );

    // 5. Savings Goals
    const savingsGoals = FinancialEngine.getSavingsGoals(savings);

    // 6. Mortgages — fetch extra payments for accurate calculations
    const activeMortgages = mortgages.filter((m) => m.is_active);
    const extraPaymentsMap = new Map<string, Array<{ amount: number; date: string; type?: string }>>();
    if (activeMortgages.length > 0) {
      const extraResults = await Promise.allSettled(
        activeMortgages.map((m) => mortgageApi.listExtraPayments(m.id)),
      );
      activeMortgages.forEach((m, i) => {
        const result = extraResults[i];
        if (result?.status === 'fulfilled') {
          extraPaymentsMap.set(m.id, result.value);
        }
      });
    }
    const mortgageResults = FinancialEngine.getMortgages(mortgages, extraPaymentsMap);

    // 7. Upcoming Activity
    const upcomingActivity = FinancialEngine.getUpcomingActivity(recurrings);

    // 8. Top Spending Categories (computed from transaction data)
    const categorySpending = new Map<string, { name: string; amount: number }>();
    for (const txn of transactions) {
      if (!txn.category_id) continue;
      const cat = categoryMap.get(txn.category_id);
      if (cat?.type !== 'income') {
        const amount = Math.abs(Number(txn.amount ?? 0));
        const existing = categorySpending.get(txn.category_id);
        if (existing) {
          existing.amount += amount;
        } else {
          categorySpending.set(txn.category_id, { name: cat?.name ?? 'Unknown', amount });
        }
      }
    }
    const topSpendingCategories = [...categorySpending.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c) => ({ categoryName: c.name, amount: c.amount }));

    // 9. Recent Transactions (last 5)
    const recentTransactions = transactions.slice(0, 5).map((txn) => {
      const cat = txn.category_id ? categoryMap.get(txn.category_id) : null;
      return {
        id: txn.id,
        amount: Number(txn.amount ?? 0),
        date: txn.date,
        merchant: txn.merchant,
        categoryName: cat?.name ?? null,
        accountName: txn.account_id ? accountMap.get(txn.account_id) ?? null : null,
      };
    });

    return {
      netWorth,
      cashFlow,
      budgetHealth,
      financialHealth,
      savingsGoals,
      mortgages: mortgageResults,
      upcomingActivity,
      topSpendingCategories,
      recentTransactions,
      errors,
    };
  },
};
