import { FinancialEngine } from '@/services/FinancialEngine';
import type { Account, Budget, Category, Transaction, SavingsGoal, Mortgage } from '@budgetos/database';
import type { CoachQuestionId, CoachAnswer, CoachMetric, CoachCalculation, CoachRecommendation, CoachSummary } from './coachTypes';

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function computeDateRange(timeRange: '30d' | '90d' | '1y' | 'all'): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: string;
  switch (timeRange) {
    case '30d': start = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10); break;
    case '90d': start = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10); break;
    case '1y': start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10); break;
    case 'all': default: start = '2000-01-01'; break;
  }
  return { start, end };
}

function loadContext(data: {
  accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[];
  savingsGoals: SavingsGoal[]; mortgages: Mortgage[]; recurrings: Array<{ amount: number; frequency: string; type: string; status: string; name: string }>;
}) {
  const range = computeDateRange('30d');
  const netWorth = FinancialEngine.getNetWorth(data.accounts);
  const cashFlow = FinancialEngine.getCashFlow(data.transactions, data.recurrings, range);
  const monthlyIncome = cashFlow.monthlyIncome;
  const monthlyExpenses = cashFlow.monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((cashFlow.cashFlow / monthlyIncome) * 100) : 0;
  const budgetHealth = data.budgets.length > 0
    ? FinancialEngine.getBudgetHealth(data.budgets, data.transactions, data.categories, cashFlow.monthlyIncome)
    : null;
  return { netWorth, cashFlow, monthlyIncome, monthlyExpenses, savingsRate, budgetHealth, range };
}

export class FinancialCoachEngine {
  static answer(data: {
    accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[];
    savingsGoals: SavingsGoal[]; mortgages: Mortgage[]; recurrings: Array<{ amount: number; frequency: string; type: string; status: string; name: string }>;
  }, questionId: CoachQuestionId): CoachAnswer {
    const ctx = loadContext(data);

    switch (questionId) {
      case 'spending-summary': return FinancialCoachEngine.spendingSummary(ctx, data);
      case 'budget-health': return FinancialCoachEngine.budgetHealthAnswer(ctx, data);
      case 'savings-progress': return FinancialCoachEngine.savingsProgressAnswer(data);
      case 'mortgage-status': return FinancialCoachEngine.mortgageStatusAnswer(data);
      case 'cash-flow': return FinancialCoachEngine.cashFlowAnswer(ctx);
      case 'net-worth': return FinancialCoachEngine.netWorthAnswer(ctx);
      case 'safe-to-spend': return FinancialCoachEngine.safeToSpendAnswer(ctx, data);
      case 'forecast': return FinancialCoachEngine.forecastAnswer(ctx, data);
      case 'recurring-overview': return FinancialCoachEngine.recurringAnswer(data);
      case 'top-categories': return FinancialCoachEngine.topCategoriesAnswer(ctx, data);
    }
  }

  static generateRecommendations(data: {
    accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[];
    savingsGoals: SavingsGoal[]; mortgages: Mortgage[]; recurrings: Array<{ amount: number; frequency: string; type: string; status: string; name: string }>;
  }): CoachRecommendation[] {
    const ctx = loadContext(data);
    const recs: CoachRecommendation[] = [];

    if (ctx.savingsRate < 10) {
      const targetSavings = ctx.monthlyIncome * 0.2;
      const gap = targetSavings - (ctx.monthlyIncome - ctx.monthlyExpenses);
      recs.push({
        id: 'rec-savings-rate',
        title: 'Increase savings rate to 20%',
        description: `Your current savings rate is ${pct(ctx.savingsRate)}, which is below the recommended 20%.`,
        priority: ctx.savingsRate < 5 ? 'critical' as const : 'high' as const,
        impact: `Build an extra ${fmt(targetSavings * 12)} in annual savings`,
        savings: Math.max(0, gap),
        category: 'savings',
        actionLabel: 'Set up auto-savings',
        reasoning: `Saving ${pct(ctx.savingsRate)} of income leaves little room for emergencies and long-term growth. A 20% rate builds a 6-month emergency fund faster.`,
        supportingCalculation: `Target monthly savings: ${fmt(targetSavings)} (${fmt(ctx.monthlyIncome)} × 20%). Current monthly savings: ${fmt(ctx.monthlyIncome - ctx.monthlyExpenses)}. Gap: ${fmt(Math.max(0, gap))}/mo.`,
      });
    }

    const overBudgetCategories = ctx.budgetHealth ? ctx.budgetHealth.categories.filter((c) => c.status === 'over') : [];
    if (overBudgetCategories.length > 0) {
      for (const cat of overBudgetCategories.slice(0, 2)) {
        const reductionTarget = Math.min(cat.spent - cat.budgeted, cat.spent * 0.15);
        recs.push({
          id: `rec-budget-${cat.categoryId}`,
          title: `Reduce ${cat.categoryName} spending by 15%`,
          description: `${cat.categoryName} is over budget by ${fmt(cat.spent - cat.budgeted)}.`,
          priority: cat.percentUsed > 120 ? 'critical' as const : 'high' as const,
          impact: `Save ~${fmt(reductionTarget)} per month (${fmt(reductionTarget * 12)}/yr)`,
          savings: reductionTarget,
          category: 'budget',
          actionLabel: `Set ${cat.categoryName} limit`,
          reasoning: `${cat.categoryName} spent ${fmt(cat.spent)} against a budget of ${fmt(cat.budgeted)}, exceeding by ${(cat.percentUsed - 100).toFixed(0)}%.`,
          supportingCalculation: `Current spending: ${fmt(cat.spent)}. 15% reduction: ${fmt(reductionTarget)}. New target: ${fmt(cat.spent - reductionTarget)}/mo. Annual savings: ${fmt(reductionTarget * 12)}.`,
        });
      }
    }

    const goalResults = FinancialEngine.getSavingsGoals(data.savingsGoals);
    const activeGoals = goalResults.filter((g) => g.percentComplete < 100);
    if (activeGoals.length > 0 && ctx.cashFlow.cashFlow > 0) {
      const boostAmount = Math.min(ctx.cashFlow.cashFlow * 0.3, 200);
      recs.push({
        id: 'rec-boost-savings',
        title: `Boost savings by ${fmt(boostAmount)}/month`,
        description: `You have ${activeGoals.length} active goal(s) and positive cash flow of ${fmt(ctx.cashFlow.cashFlow)}.`,
        priority: 'medium' as const,
        impact: `${fmt(boostAmount * 12)} more toward goals per year`,
        savings: boostAmount,
        category: 'savings',
        actionLabel: 'Increase contributions',
        reasoning: `With ${fmt(ctx.cashFlow.cashFlow)} surplus and ${activeGoals.length} active goals, allocating ${fmt(boostAmount)} accelerates progress.`,
        supportingCalculation: `Surplus: ${fmt(ctx.cashFlow.cashFlow)}. 30% allocation: ${fmt(boostAmount)}. Annual boost: ${fmt(boostAmount * 12)}.`,
      });
    }

    const mortgageResults = FinancialEngine.getMortgages(data.mortgages);
    const activeMortgage = mortgageResults[0];
    if (activeMortgage && ctx.cashFlow.cashFlow > 200) {
      const extraPayment = Math.min(ctx.cashFlow.cashFlow * 0.2, activeMortgage.originalPrincipal * 0.01);
      recs.push({
        id: 'rec-mortgage-extra',
        title: `Pay ${fmt(extraPayment)} extra on mortgage`,
        description: `Adding ${fmt(extraPayment)}/month to your mortgage payment reduces interest and accelerates payoff.`,
        priority: 'medium' as const,
        impact: `Reduce interest, pay off faster`,
        savings: activeMortgage.interestSaved,
        category: 'mortgage',
        actionLabel: 'Schedule extra payment',
        reasoning: `Extra payments go directly to principal, reducing total interest and shortening the loan term.`,
        supportingCalculation: `Extra payment: ${fmt(extraPayment)}/mo. Current interest saved with existing strategy: ${fmt(activeMortgage.interestSaved)}.`,
      });
    }

    return recs;
  }

  static generateSummary(data: {
    accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[];
    savingsGoals: SavingsGoal[]; mortgages: Mortgage[]; recurrings: Array<{ amount: number; frequency: string; type: string; status: string; name: string }>;
  }): CoachSummary {
    const ctx = loadContext(data);
    const goalResults = FinancialEngine.getSavingsGoals(data.savingsGoals);
    const activeGoals = goalResults.filter((g) => g.percentComplete < 100);
    const alerts = ctx.budgetHealth ? ctx.budgetHealth.categories.filter((c) => c.status === 'over').length : 0;
    const recs = FinancialCoachEngine.generateRecommendations(data);
    return {
      totalIncome: ctx.monthlyIncome,
      totalExpenses: ctx.monthlyExpenses,
      netWorth: ctx.netWorth.netWorth,
      savingsRate: ctx.savingsRate,
      budgetHealth: ctx.savingsRate >= 20 && alerts === 0 ? 'good' as const : ctx.savingsRate >= 10 ? 'fair' as const : 'poor' as const,
      activeGoals: activeGoals.length,
      topAlerts: alerts,
      lastUpdated: new Date().toISOString(),
      recommendationCount: recs.length,
    };
  }

  // ==========================================================================
  // Private helpers - one per question type
  // ==========================================================================

  private static spendingSummary(ctx: ReturnType<typeof loadContext>, _data: { categories: Category[]; transactions: Transaction[] }): CoachAnswer {
    const metrics: CoachMetric[] = [
      { label: 'Total Spending', value: fmt(ctx.monthlyExpenses), color: 'var(--status-error)' },
      { label: 'Monthly Income', value: fmt(ctx.monthlyIncome), color: 'var(--status-success)' },
      { label: 'Spending vs Income', value: ctx.monthlyIncome > 0 ? pct((ctx.monthlyExpenses / ctx.monthlyIncome) * 100) : 'N/A' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Spending-to-income ratio', formula: `${fmt(ctx.monthlyExpenses)} ÷ ${fmt(ctx.monthlyIncome)} × 100`, result: ctx.monthlyIncome > 0 ? pct((ctx.monthlyExpenses / ctx.monthlyIncome) * 100) : 'N/A' },
    ];
    const ratio = ctx.monthlyIncome > 0 ? (ctx.monthlyExpenses / ctx.monthlyIncome) : 1;
    const nextActions = ratio > 0.8
      ? ['Review discretionary categories for cuts', 'Set category-specific spending limits', 'Track daily expenses for 30 days']
      : ['Continue monitoring spending patterns', 'Review for subscription optimization opportunities'];
    return {
      questionId: 'spending-summary', summary: `You spend ${fmt(ctx.monthlyExpenses)}/mo against ${fmt(ctx.monthlyIncome)} income (${pct(ratio * 100)} ratio).`,
      metrics, calculations, confidence: 95, nextActions,
      referencedMetrics: ['monthlyExpenses', 'monthlyIncome'],
    };
  }

  private static budgetHealthAnswer(ctx: ReturnType<typeof loadContext>, data: { budgets: Budget[] }): CoachAnswer {
    if (!ctx.budgetHealth || data.budgets.length === 0) {
      return { questionId: 'budget-health', summary: 'No budgets set up yet. Create budgets to track spending.', metrics: [], calculations: [], confidence: 100, nextActions: ['Set up monthly budgets'], referencedMetrics: [] };
    }
    const overCount = ctx.budgetHealth.categories.filter((c) => c.status === 'over').length;
    const metrics: CoachMetric[] = [
      { label: 'Total Budgeted', value: fmt(ctx.budgetHealth.totalBudgeted) },
      { label: 'Total Spent', value: fmt(ctx.budgetHealth.totalSpent) },
      { label: 'Remaining', value: fmt(ctx.budgetHealth.remaining), color: ctx.budgetHealth.remaining >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
      { label: 'Categories Over', value: `${overCount}`, color: overCount > 0 ? 'var(--status-warning)' : 'var(--status-success)' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Budget utilization', formula: `${fmt(ctx.budgetHealth.totalSpent)} ÷ ${fmt(ctx.budgetHealth.totalBudgeted)} × 100`, result: ctx.budgetHealth.totalBudgeted > 0 ? pct((ctx.budgetHealth.totalSpent / ctx.budgetHealth.totalBudgeted) * 100) : '0%' },
    ];
    const nextActions = overCount > 0
      ? [`Review ${overCount} over-budget categor${overCount > 1 ? 'ies' : 'y'}`, 'Adjust budget allocations to match spending patterns']
      : ['Budgets are on track', 'Consider optimizing under-utilized categories'];
    return {
      questionId: 'budget-health', summary: `Budget health: ${overCount > 0 ? `${overCount} categor${overCount > 1 ? 'ies' : 'y'} over budget` : 'All categories on track'}.`,
      metrics, calculations, confidence: 90, nextActions,
      referencedMetrics: ['totalBudgeted', 'totalSpent', 'totalRemaining'],
    };
  }

  private static savingsProgressAnswer(data: { savingsGoals: SavingsGoal[] }): CoachAnswer {
    if (data.savingsGoals.length === 0) {
      return { questionId: 'savings-progress', summary: 'No savings goals yet. Start by creating a goal.', metrics: [], calculations: [], confidence: 100, nextActions: ['Create your first savings goal'], referencedMetrics: [] };
    }
    const goalResults = FinancialEngine.getSavingsGoals(data.savingsGoals);
    const totalTarget = goalResults.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = goalResults.reduce((s, g) => s + g.currentAmount, 0);
    const completed = goalResults.filter((g) => g.percentComplete >= 100).length;
    const onTrack = goalResults.filter((g) => g.percentComplete < 100 && g.onTrack).length;
    const overallPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    const metrics: CoachMetric[] = [
      { label: 'Total Saved', value: fmt(totalCurrent), color: 'var(--status-success)' },
      { label: 'Total Target', value: fmt(totalTarget) },
      { label: 'Overall Progress', value: pct(overallPct) },
      { label: 'Completed Goals', value: `${completed}`, color: 'var(--status-success)' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Overall savings progress', formula: `${fmt(totalCurrent)} ÷ ${fmt(totalTarget)} × 100`, result: pct(overallPct) },
    ];
    const nextActions = onTrack > 0 ? [`${onTrack} goal(s) on track — keep contributing`] : ['Consider adjusting savings targets'];
    return {
      questionId: 'savings-progress', summary: `You've saved ${fmt(totalCurrent)} toward ${fmt(totalTarget)} in goals (${pct(overallPct)} overall).`,
      metrics, calculations, confidence: 90, nextActions,
      referencedMetrics: ['totalCurrent', 'totalTarget', 'overallPct'],
    };
  }

  private static mortgageStatusAnswer(data: { mortgages: Mortgage[] }): CoachAnswer {
    const results = FinancialEngine.getMortgages(data.mortgages);
    const active = results[0];
    if (!active) {
      return { questionId: 'mortgage-status', summary: 'No active mortgage found.', metrics: [], calculations: [], confidence: 100, nextActions: [], referencedMetrics: [] };
    }
    const metrics: CoachMetric[] = [
      { label: 'Remaining Balance', value: fmt(active.remainingBalance) },
      { label: 'Monthly Payment', value: fmt(active.monthlyPayment) },
      { label: 'Progress', value: pct(active.progressPct) },
      { label: 'Payoff Date', value: active.payoffDate },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Loan progress', formula: `${fmt(active.remainingBalance)} remaining of ${fmt(active.originalPrincipal)} principal`, result: pct(active.progressPct) },
    ];
    const nextActions = active.interestSaved > 0
      ? [`Current extra payment saves ${fmt(active.interestSaved)} in interest`]
      : ['Consider adding extra payments to save on interest'];
    return {
      questionId: 'mortgage-status', summary: `Mortgage: ${fmt(active.remainingBalance)} remaining, ${pct(active.progressPct)} paid off. Est. payoff: ${active.payoffDate}.`,
      metrics, calculations, confidence: 95, nextActions,
      referencedMetrics: ['remainingBalance', 'monthlyPayment', 'progressPct'],
    };
  }

  private static cashFlowAnswer(ctx: ReturnType<typeof loadContext>): CoachAnswer {
    const metrics: CoachMetric[] = [
      { label: 'Monthly Income', value: fmt(ctx.monthlyIncome), color: 'var(--status-success)' },
      { label: 'Monthly Expenses', value: fmt(ctx.monthlyExpenses), color: 'var(--status-error)' },
      { label: 'Net Cash Flow', value: fmt(ctx.cashFlow.cashFlow), color: ctx.cashFlow.cashFlow >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
      { label: 'Savings Rate', value: pct(ctx.savingsRate), color: ctx.savingsRate >= 20 ? 'var(--status-success)' : 'var(--status-warning)' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Net cash flow', formula: `${fmt(ctx.monthlyIncome)} - ${fmt(ctx.monthlyExpenses)}`, result: fmt(ctx.cashFlow.cashFlow) },
      { description: 'Savings rate', formula: `${fmt(ctx.cashFlow.cashFlow)} ÷ ${fmt(ctx.monthlyIncome)} × 100`, result: pct(ctx.savingsRate) },
    ];
    const nextActions = ctx.cashFlow.cashFlow < 0
      ? ['Negative cash flow — reduce expenses immediately', 'Review non-essential subscriptions', 'Consider increasing income sources']
      : ctx.savingsRate < 20
        ? ['Increase savings toward 20% target', 'Consider automating transfers to savings']
        : ['Positive cash flow maintained', 'Look into investment opportunities'];
    return {
      questionId: 'cash-flow', summary: `Cash flow is ${ctx.cashFlow.cashFlow >= 0 ? 'positive' : 'negative'} at ${fmt(ctx.cashFlow.cashFlow)}/mo with a savings rate of ${pct(ctx.savingsRate)}.`,
      metrics, calculations, confidence: 90, nextActions,
      referencedMetrics: ['monthlyIncome', 'monthlyExpenses', 'cashFlow', 'savingsRate'],
    };
  }

  private static netWorthAnswer(ctx: ReturnType<typeof loadContext>): CoachAnswer {
    const metrics: CoachMetric[] = [
      { label: 'Net Worth', value: fmt(ctx.netWorth.netWorth), color: ctx.netWorth.netWorth >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
      { label: 'Total Assets', value: fmt(ctx.netWorth.totalAssets), color: 'var(--status-success)' },
      { label: 'Total Liabilities', value: fmt(ctx.netWorth.totalLiabilities), color: 'var(--status-error)' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Net worth calculation', formula: `${fmt(ctx.netWorth.totalAssets)} - ${fmt(ctx.netWorth.totalLiabilities)}`, result: fmt(ctx.netWorth.netWorth) },
    ];
    const nextActions = ctx.netWorth.netWorth < 0
      ? ['Focus on reducing debt to move net worth positive', 'Review high-interest liabilities first']
      : ['Net worth is positive — focus on growth', 'Consider diversified investments'];
    return {
      questionId: 'net-worth', summary: `Net worth is ${fmt(ctx.netWorth.netWorth)} (${fmt(ctx.netWorth.totalAssets)} in assets, ${fmt(ctx.netWorth.totalLiabilities)} in liabilities).`,
      metrics, calculations, confidence: 95, nextActions,
      referencedMetrics: ['netWorth', 'totalAssets', 'totalLiabilities'],
    };
  }

  private static safeToSpendAnswer(ctx: ReturnType<typeof loadContext>, _data: { accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[] }): CoachAnswer {
    const safeAmount = Math.max(0, ctx.cashFlow.cashFlow);
    const metrics: CoachMetric[] = [
      { label: 'After Essentials', value: fmt(Math.max(0, ctx.monthlyIncome - ctx.monthlyExpenses)), color: ctx.monthlyIncome > ctx.monthlyExpenses ? 'var(--status-success)' : 'var(--status-error)' },
      { label: 'Remaining Budget', value: fmt(ctx.budgetHealth?.remaining ?? 0) },
      { label: 'Safe to Spend', value: fmt(safeAmount), color: safeAmount > 0 ? 'var(--status-success)' : 'var(--status-warning)' },
    ];
    const calculations: CoachCalculation[] = [
      { description: 'Safe-to-spend estimate', formula: `${fmt(ctx.monthlyIncome)} - ${fmt(ctx.monthlyExpenses)}`, result: fmt(safeAmount) },
    ];
    const nextActions = safeAmount <= 0
      ? ['Reduce fixed expenses to create spending room', 'Review and cut discretionary categories']
      : [`You have ${fmt(safeAmount)} available after essentials`];
    return {
      questionId: 'safe-to-spend', summary: `You have ${fmt(safeAmount)} safe to spend after covering essentials.`,
      metrics, calculations, confidence: 80, nextActions,
      referencedMetrics: ['monthlyIncome', 'monthlyExpenses'],
    };
  }

  private static forecastAnswer(ctx: ReturnType<typeof loadContext>, data: { accounts: Account[]; savingsGoals: SavingsGoal[] }): CoachAnswer {
    const totalSaved = data.savingsGoals.reduce((s, g) => s + (g.current_amount ?? 0), 0);
    const totalDebt = ctx.netWorth.totalLiabilities;
    const projections = FinancialEngine.getProjections(
      ctx.netWorth.netWorth, totalSaved, totalDebt,
      ctx.monthlyIncome, ctx.monthlyExpenses, Math.max(0, ctx.savingsRate), 0, 0, 0.07, [],
    );
    const lastProj = projections.projections[projections.projections.length - 1];
    const metrics: CoachMetric[] = [
      { label: 'Current Net Worth', value: fmt(ctx.netWorth.netWorth) },
      { label: 'Projected (12mo)', value: lastProj ? fmt(lastProj.netWorth) : 'N/A', trend: lastProj && lastProj.netWorth >= ctx.netWorth.netWorth ? 'up' as const : 'down' as const },
      { label: 'Projected Savings', value: lastProj ? fmt(lastProj.savings) : 'N/A', trend: 'up' as const },
    ];
    const calculations: CoachCalculation[] = [
      { description: '12-month net worth projection', formula: `${fmt(ctx.netWorth.netWorth)} growing at ${pct(Math.max(0, ctx.savingsRate))} savings rate`, result: lastProj ? fmt(lastProj.netWorth) : 'N/A' },
    ];
    const nextActions = ctx.savingsRate < 10
      ? ['Increase savings rate to improve projection', 'Review expense categories for cuts']
      : ['Savings rate supports growth', 'Consider investment options for surplus'];
    return {
      questionId: 'forecast', summary: `12-month outlook: Net worth projected at ${lastProj ? fmt(lastProj.netWorth) : 'N/A'} with savings at ${lastProj ? fmt(lastProj.savings) : 'N/A'}.`,
      metrics, calculations, confidence: 70, nextActions,
      referencedMetrics: ['netWorth', 'savingsRate'],
    };
  }

  private static recurringAnswer(data: { recurrings: Array<{ amount: number; frequency: string; type: string; status: string; name: string }> }): CoachAnswer {
    const active = data.recurrings.filter((r) => r.status === 'active');
    const bills = active.filter((r) => r.type === 'expense');
    const incomeRecurring = active.filter((r) => r.type === 'income');
    const monthlyTotal = bills.reduce((s, r) => s + Math.abs(r.amount), 0);
    const metrics: CoachMetric[] = [
      { label: 'Active Recurring', value: `${active.length}` },
      { label: 'Monthly Bills', value: `${bills.length}`, color: bills.length > 0 ? 'var(--status-warning)' : 'var(--status-success)' },
      { label: 'Total Monthly Bills', value: fmt(monthlyTotal) },
      { label: 'Recurring Income', value: `${incomeRecurring.length}`, color: 'var(--status-success)' },
    ];
    const nextActions = bills.length > 5
      ? ['Audit subscriptions for unused services', 'Review bill negotiation opportunities']
      : ['Recurring expenses are manageable'];
    return {
      questionId: 'recurring-overview', summary: `You have ${active.length} active recurring transactions (${bills.length} bills totaling ${fmt(monthlyTotal)}/mo, ${incomeRecurring.length} income sources).`,
      metrics, calculations: [], confidence: 95, nextActions,
      referencedMetrics: ['recurringCount', 'billsCount'],
    };
  }

  private static topCategoriesAnswer(ctx: ReturnType<typeof loadContext>, data: { categories: Category[]; transactions: Transaction[] }): CoachAnswer {
    const categorySpending = new Map<string, number>();
    for (const t of data.transactions) {
      if (Number(t.amount) >= 0 || !t.category_id) continue;
      categorySpending.set(t.category_id, (categorySpending.get(t.category_id) ?? 0) + Math.abs(Number(t.amount)));
    }
    const total = Array.from(categorySpending.values()).reduce((s, v) => s + v, 0) || 1;
    const sorted = Array.from(categorySpending.entries())
      .map(([id, value]) => ({ id, name: data.categories.find((c) => c.id === id)?.name ?? id, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value).slice(0, 5);
    const top = sorted[0];
    const metrics: CoachMetric[] = sorted.map((c) => ({ label: c.name, value: `${fmt(c.value)} (${c.pct}%)` }));
    const nextActions = top ? [`Review "${top.name}" spending — ${top.pct}% of total`] : [];
    return {
      questionId: 'top-categories', summary: top ? `Top category: "${top.name}" at ${fmt(top.value)} (${top.pct}% of spending).` : 'No spending data available.',
      metrics, calculations: [], confidence: 90, nextActions,
      referencedMetrics: ['topCategory'],
    };
  }
}

export { fmt, pct };
