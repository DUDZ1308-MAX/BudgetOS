import type {
  BasicContext,
  BudgetContext,
  CoachContext,
  CoachSnapshotData,
  DebtContext,
  ForecastContext,
  GoalContext,
  HealthContext,
  SpendingContext,
} from './types';
import { tiersForIntent } from './intent';
import type { CoachIntent } from './types';

// ============================================================================
// Tiered context assembly (Phase 4 — context size management).
//
// Only the tiers relevant to the detected intent are assembled and later
// serialized into the prompt. This keeps token usage, latency, provider cost
// and privacy exposure proportional to what the question actually needs.
// ============================================================================

function buildBasicContext(s: CoachSnapshotData): BasicContext {
  const d = s.dashboard;
  return {
    asOfDate: s.asOfDate,
    netWorth: d.netWorth.netWorth,
    totalAssets: d.netWorth.totalAssets,
    totalLiabilities: d.netWorth.totalLiabilities,
    availableCash: d.availableCash,
    monthlyIncome: d.cashFlow.monthlyIncome,
    monthlyExpenses: d.cashFlow.monthlyExpenses,
    netCashFlow: d.cashFlow.cashFlow,
    savingsRate: d.savingsRate,
    accountCount: d.netWorth.accounts.length,
    mortgageCount: d.mortgages.length,
    savingsGoalCount: d.savingsGoals.length,
  };
}

function computeChangePercent(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function buildSpendingContext(s: CoachSnapshotData): SpendingContext {
  const cur = s.currentMonth;
  const prev = s.previousMonth;
  const change = cur.expenses - prev.expenses;
  const changePercent = computeChangePercent(prev.expenses, cur.expenses);

  const prevByName = new Map(prev.byCategory.map((c) => [c.categoryId, c.amount]));
  const topCategories = cur.byCategory
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c) => ({ name: c.categoryName || 'Uncategorized', amount: c.amount, percentage: c.percentage }));

  const categoryChanges = cur.byCategory
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .map((c) => {
      const name = c.categoryName || 'Uncategorized';
      const previous = prevByName.get(c.categoryId) ?? 0;
      return {
        name,
        current: c.amount,
        previous,
        change: c.amount - previous,
        changePercent: computeChangePercent(previous, c.amount),
      };
    })
    .filter((c) => c.current >= 25 || c.previous >= 25)
    .sort((a, b) => b.change - a.change)
    .slice(0, 6);

  const recentTransactions = s.dashboard.recentTransactions
    .slice(0, 8)
    .map((t) => ({ merchant: t.merchant, amount: t.amount, date: t.date, categoryName: t.categoryName }));

  return {
    currentMonthLabel: cur.label,
    previousMonthLabel: prev.label,
    currentExpenses: cur.expenses,
    previousExpenses: prev.expenses,
    change,
    changePercent,
    topCategories,
    categoryChanges,
    recentTransactions,
  };
}

function buildBudgetContext(s: CoachSnapshotData): BudgetContext {
  const bh = s.dashboard.budgetHealth;
  return {
    totalBudgeted: bh.totalBudgeted,
    totalSpent: bh.totalSpent,
    totalRemaining: bh.remaining,
    adherencePercent: bh.adherencePercent,
    overallStatus: bh.overallStatus,
    overBudget: bh.categories
      .filter((c) => c.status === 'over')
      .map((c) => ({
        categoryName: c.categoryName,
        budgeted: c.budgeted,
        spent: c.spent,
        remaining: c.remaining,
        percentUsed: c.percentUsed,
      })),
    topByUsage: bh.categories
      .slice()
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, 5)
      .map((c) => ({
        categoryName: c.categoryName,
        budgeted: c.budgeted,
        spent: c.spent,
        percentUsed: c.percentUsed,
        status: c.status,
      })),
  };
}

function buildDebtContext(s: CoachSnapshotData): DebtContext {
  const rawById = new Map(s.rawMortgages.map((m) => [m.id, m]));
  const nonMortgageDebt = Math.max(
    0,
    s.dashboard.netWorth.totalLiabilities
      - s.dashboard.mortgages.reduce((sum, m) => sum + m.remainingBalance, 0),
  );
  return {
    mortgages: s.dashboard.mortgages.map((m) => {
      const raw = rawById.get(m.id);
      const extraPayment = (raw?.extraPayments ?? [])
        .filter((e) => e.type === 'monthly' || !e.type)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: m.name,
        monthlyPayment: m.monthlyPayment,
        remainingBalance: m.remainingBalance,
        annualRate: raw?.annualRate ?? 0,
        payoffDate: m.payoffDate,
        payoffMonths: m.payoffMonths,
        yearsRemaining: m.yearsRemaining,
        totalInterest: m.totalInterest,
        interestSaved: m.interestSaved,
        progressPct: m.progressPct,
        extraPayment,
      };
    }),
    nonMortgageDebt,
  };
}

function buildGoalContext(s: CoachSnapshotData): GoalContext {
  return {
    savingsGoals: s.dashboard.savingsGoals.map((g) => ({
      name: g.name,
      current: g.currentAmount,
      target: g.targetAmount,
      percentComplete: g.percentComplete,
      targetDate: g.targetDate,
      onTrack: g.onTrack,
      estimatedCompletionDate: g.estimatedCompletionDate,
      monthsRemaining: g.monthsRemaining,
    })),
    totalSaved: s.dashboard.savingsSnapshot.totalSaved,
    totalTarget: s.dashboard.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0),
    activeGoalCount: s.dashboard.savingsGoals.filter((g) => g.percentComplete < 100).length,
  };
}

function buildForecastContext(s: CoachSnapshotData): ForecastContext {
  const f = s.forecast;
  const upcomingIncome = s.dashboard.upcomingActivity.filter((u) => u.type === 'income').slice(0, 5);
  const upcomingBills = s.dashboard.upcomingActivity.filter((u) => u.type === 'expense').slice(0, 8);
  return {
    asOfDate: f.asOfDate,
    availableCash: f.availableCash,
    windows: ([30, 60, 90] as const).map((w) => {
      const r = f.ranges[w];
      return {
        window: w,
        endingBalance: r?.endingBalance ?? 0,
        income: r?.income ?? 0,
        expenses: r?.expenses ?? 0,
        netCashFlow: r?.netCashFlow ?? 0,
        lowestBalance: r?.lowestBalance ?? 0,
        lowestBalanceDate: r?.lowestBalanceDate ?? null,
        daysBelowZero: r?.daysBelowZero ?? 0,
      };
    }),
    warnings: f.warnings,
    upcomingIncome,
    upcomingBills,
  };
}

function buildHealthContext(s: CoachSnapshotData): HealthContext {
  const fh = s.dashboard.financialHealth;
  return {
    overallScore: fh.overallScore,
    tier: fh.tier,
    components: fh.components,
    recommendations: fh.recommendations.slice(0, 5),
  };
}

export function buildCoachContext(snapshot: CoachSnapshotData, intent: CoachIntent): CoachContext {
  const tiers = tiersForIntent(intent);
  const context: CoachContext = { intent, tiers };

  for (const tier of tiers) {
    switch (tier) {
      case 'basic': context.basic = buildBasicContext(snapshot); break;
      case 'spending': context.spending = buildSpendingContext(snapshot); break;
      case 'budget': context.budget = buildBudgetContext(snapshot); break;
      case 'debt': context.debt = buildDebtContext(snapshot); break;
      case 'goal': context.goal = buildGoalContext(snapshot); break;
      case 'forecast': context.forecast = buildForecastContext(snapshot); break;
      case 'health': context.health = buildHealthContext(snapshot); break;
    }
  }

  return context;
}
