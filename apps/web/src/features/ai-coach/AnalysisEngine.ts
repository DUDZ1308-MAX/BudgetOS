import type { AiInsight, AiRecommendation, AiAchievement, AiWarning, AiFinancialSummary, AiAnalysisResult } from './types';
import type { DashboardSummaryData } from '@/lib/dashboard/types';

let insightCounter = 0;
let recCounter = 0;

function insightId(): string {
  insightCounter++;
  return `insight_${Date.now()}_${insightCounter}`;
}

function recId(): string {
  recCounter++;
  return `rec_${Date.now()}_${recCounter}`;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function buildSummary(d: DashboardSummaryData): AiFinancialSummary {
  const budgetUtil = d.budgetUtilization.length > 0
    ? d.budgetUtilization.reduce((s, c) => s + Math.min(c.percentUsed, 150), 0) / d.budgetUtilization.length
    : 0;

  const goalResults = d.savingsSnapshot;
  const mortgageProgress = d.mortgages.length > 0
    ? d.mortgages.reduce((s, m) => s + (m.progressPct ?? 0), 0) / d.mortgages.length
    : 0;

  const upcomingBills = d.upcomingActivity.filter((a) => a.type === 'expense');
  const billsTotal = upcomingBills.reduce((s, a) => s + Math.abs(a.amount), 0);

  const totalTarget = goalResults.goalCompletionPct > 0
    ? Math.round(goalResults.totalSaved / (goalResults.goalCompletionPct / 100))
    : goalResults.totalSaved;

  return {
    monthlyIncome: d.monthlyIncome,
    monthlyExpenses: d.monthlyExpenses,
    cashFlow: d.cashFlow,
    savingsRate: d.savingsRate,
    netWorth: d.netWorth,
    healthScore: d.financialHealth?.overallScore ?? 0,
    healthGrade: d.financialHealth?.letterGrade,
    totalAssets: d.totalAssets,
    totalLiabilities: d.totalLiabilities,
    budgetUtilization: Math.round(budgetUtil),
    activeGoals: goalResults.activeGoals,
    goalsOnTrack: goalResults.activeGoals,
    totalSaved: goalResults.totalSaved,
    totalTarget,
    mortgageProgress: Math.round(mortgageProgress),
    upcomingBillsCount: upcomingBills.length,
    upcomingBillsTotal: billsTotal,
  };
}

export function analyzeFinancials(d: DashboardSummaryData): AiAnalysisResult {
  const summary = buildSummary(d);
  const now = new Date().toISOString();

  const insights: AiInsight[] = [];
  const recommendations: AiRecommendation[] = [];
  const achievements: AiAchievement[] = [];
  const warnings: AiWarning[] = [];
  const savingsOpps: AiRecommendation[] = [];
  const debtOpps: AiRecommendation[] = [];
  const budgetOpts: AiRecommendation[] = [];
  const trends: AiInsight[] = [];

  // === INSIGHTS ===
  insights.push(...generateSpendingInsights(d, now));
  insights.push(...generateCashFlowInsights(d, now));
  insights.push(...generateSavingsInsights(d, now));
  insights.push(...generateBudgetInsights(d, now));
  insights.push(...generateMortgageInsights(d, now));
  insights.push(...generateNetWorthInsights(d, now));

  // === RECOMMENDATIONS ===
  recommendations.push(...generateSavingsRecommendations(d, summary, now));
  recommendations.push(...generateBudgetRecommendations(d, summary, now));
  recommendations.push(...generateMortgageRecommendations(d, summary, now));
  recommendations.push(...generateSpendingRecommendations(d, summary, now));
  recommendations.push(...generateCashFlowRecommendations(d, summary, now));

  // === ACHIEVEMENTS ===
  achievements.push(...detectAchievements(d, now));

  // === WARNINGS ===
  warnings.push(...detectWarnings(d, now));

  // === OPPORTUNITIES ===
  savingsOpps.push(...generateSavingsOpportunities(d, summary, now));
  debtOpps.push(...generateDebtOpportunities(d, summary, now));
  budgetOpts.push(...generateBudgetOptimizations(d, summary, now));

  // === TRENDS ===
  trends.push(...generateTrendInsights(d, now));

  // === CASH FLOW FORECAST ===
  const cashFlowForecast = generateCashFlowForecast(d);

  return {
    summary,
    insights,
    recommendations,
    achievements,
    warnings,
    savingsOpportunities: savingsOpps,
    debtOpportunities: debtOpps,
    budgetOptimizations: budgetOpts,
    cashFlowForecast,
    recentTrends: trends,
  };
}

// ============================================================================
// SPENDING INSIGHTS
// ============================================================================

function generateSpendingInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];
  const { topSpendingCategories } = d;

  if (topSpendingCategories.length > 0) {
    const totalSpending = topSpendingCategories.reduce((s, c) => s + c.amount, 0) || 1;
    const top = topSpendingCategories[0];
    if (top) {
      const topPct = (top.amount / totalSpending) * 100;
      if (topPct > 30) {
        insights.push({
          id: insightId(),
          type: 'spending',
          severity: topPct > 40 ? 'negative' : 'neutral',
          title: `${top.categoryName} dominates spending`,
          description: `${top.categoryName} accounts for ${pct(topPct)} of your total spending at ${fmt(top.amount)}/mo.`,
          metric: top.categoryName,
          value: fmt(top.amount),
          actionable: true,
          category: 'spending',
          createdAt: now,
        });
      }
    }
  }

  if (d.monthlyExpenses > d.monthlyIncome && d.monthlyIncome > 0) {
    const overspend = d.monthlyExpenses - d.monthlyIncome;
    insights.push({
      id: insightId(),
      type: 'spending',
      severity: 'negative',
      title: 'Spending exceeds income',
      description: `You're spending ${fmt(overspend)} more than you earn this month. This pattern is unsustainable.`,
      metric: 'Overspend',
      value: fmt(overspend),
      actionable: true,
      category: 'cash_flow',
      createdAt: now,
    });
  }

  const spendingTrend = d.financialHealth?.trends?.spending;
  if (spendingTrend && spendingTrend.direction === 'declining' && Math.abs(spendingTrend.changePercent) > 5) {
    insights.push({
      id: insightId(),
      type: 'trend',
      severity: 'positive',
      title: 'Spending is trending down',
      description: `Your spending has decreased by ${pct(Math.abs(spendingTrend.changePercent))} recently. Great progress!`,
      metric: 'Spending Trend',
      value: `${spendingTrend.changePercent > 0 ? '+' : ''}${pct(spendingTrend.changePercent)}`,
      trend: 'improving',
      actionable: false,
      category: 'spending',
      createdAt: now,
    });
  }

  return insights;
}

// ============================================================================
// CASH FLOW INSIGHTS
// ============================================================================

function generateCashFlowInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];

  if (d.cashFlow > 0) {
    const monthsOfExpenses = d.monthlyExpenses > 0 ? d.cashFlow / d.monthlyExpenses : 0;
    if (monthsOfExpenses > 0.3) {
      insights.push({
        id: insightId(),
        type: 'cash_flow',
        severity: 'positive',
        title: 'Positive cash flow',
        description: `You have ${fmt(d.cashFlow)} surplus this month. That's ${pct(monthsOfExpenses * 100)} of your monthly expenses.`,
        metric: 'Cash Flow',
        value: fmt(d.cashFlow),
        trend: 'improving',
        actionable: false,
        category: 'cash_flow',
        createdAt: now,
      });
    }
  } else if (d.cashFlow < 0) {
    insights.push({
      id: insightId(),
      type: 'cash_flow',
      severity: 'negative',
      title: 'Negative cash flow',
      description: `You're spending ${fmt(Math.abs(d.cashFlow))} more than you earn. Consider reducing expenses.`,
      metric: 'Cash Flow',
      value: fmt(d.cashFlow),
      trend: 'declining',
      actionable: true,
      category: 'cash_flow',
      createdAt: now,
    });
  }

  const cfTrend = d.financialHealth?.trends?.healthScore;
  if (cfTrend && cfTrend.direction === 'improving') {
    insights.push({
      id: insightId(),
      type: 'trend',
      severity: 'positive',
      title: 'Financial health improving',
      description: `Your overall financial health score is trending upward (+${pct(Math.abs(cfTrend.changePercent))}).`,
      metric: 'Health Trend',
      value: `+${pct(Math.abs(cfTrend.changePercent))}`,
      trend: 'improving',
      actionable: false,
      category: 'health',
      createdAt: now,
    });
  }

  return insights;
}

// ============================================================================
// SAVINGS INSIGHTS
// ============================================================================

function generateSavingsInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];

  if (d.savingsRate >= 20) {
    insights.push({
      id: insightId(),
      type: 'savings',
      severity: 'positive',
      title: 'Excellent savings rate',
      description: `You're saving ${pct(d.savingsRate)} of your income, exceeding the recommended 20% target.`,
      metric: 'Savings Rate',
      value: pct(d.savingsRate),
      trend: 'improving',
      actionable: false,
      category: 'savings',
      createdAt: now,
    });
  } else if (d.savingsRate >= 10) {
    insights.push({
      id: insightId(),
      type: 'savings',
      severity: 'neutral',
      title: 'Savings rate could improve',
      description: `You're saving ${pct(d.savingsRate)} of income. The recommended target is 20%.`,
      metric: 'Savings Rate',
      value: pct(d.savingsRate),
      actionable: true,
      category: 'savings',
      createdAt: now,
    });
  } else if (d.savingsRate > 0) {
    insights.push({
      id: insightId(),
      type: 'savings',
      severity: 'negative',
      title: 'Low savings rate',
      description: `Only ${pct(d.savingsRate)} of income is being saved. Aim for at least 10-20%.`,
      metric: 'Savings Rate',
      value: pct(d.savingsRate),
      trend: 'declining',
      actionable: true,
      category: 'savings',
      createdAt: now,
    });
  }

  return insights;
}

// ============================================================================
// BUDGET INSIGHTS
// ============================================================================

function generateBudgetInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];

  const overBudget = d.budgetUtilization.filter((c) => c.percentUsed > 100);
  if (overBudget.length > 0) {
    const worst = overBudget.reduce((max, c) => c.percentUsed > max.percentUsed ? c : max);
    insights.push({
      id: insightId(),
      type: 'budget',
      severity: worst.percentUsed > 120 ? 'negative' : 'neutral',
      title: `${overBudget.length} categor${overBudget.length > 1 ? 'ies' : 'y'} over budget`,
      description: `${worst.categoryName} is at ${pct(worst.percentUsed)} of its budget (${fmt(worst.spent)} of ${fmt(worst.budgeted)}).`,
      metric: worst.categoryName,
      value: pct(worst.percentUsed),
      actionable: true,
      category: 'budget',
      createdAt: now,
    });
  }

  const nearLimit = d.budgetUtilization.filter((c) => c.percentUsed >= 80 && c.percentUsed <= 100);
  if (nearLimit.length > 0) {
    const closest = nearLimit.reduce((max, c) => c.percentUsed > max.percentUsed ? c : max);
    insights.push({
      id: insightId(),
      type: 'budget',
      severity: 'neutral',
      title: `${nearLimit.length} categor${nearLimit.length > 1 ? 'ies' : 'y'} nearing limit`,
      description: `${closest.categoryName} is at ${pct(closest.percentUsed)} of its budget. ${fmt(closest.remaining)} remaining.`,
      metric: closest.categoryName,
      value: pct(closest.percentUsed),
      actionable: true,
      category: 'budget',
      createdAt: now,
    });
  }

  if (d.budgetSnapshot.onTrack > 0 && overBudget.length === 0) {
    insights.push({
      id: insightId(),
      type: 'budget',
      severity: 'positive',
      title: 'Budgets on track',
      description: `All ${d.budgetSnapshot.onTrack} budget categories are within their limits.`,
      metric: 'Categories on track',
      value: `${d.budgetSnapshot.onTrack}`,
      trend: 'stable',
      actionable: false,
      category: 'budget',
      createdAt: now,
    });
  }

  return insights;
}

// ============================================================================
// MORTGAGE INSIGHTS
// ============================================================================

function generateMortgageInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];

  if (d.mortgages.length > 0) {
    const m = d.mortgages[0];
    if (m) {
      if (m.progressPct >= 50) {
        insights.push({
          id: insightId(),
          type: 'mortgage',
          severity: 'positive',
          title: 'Mortgage halfway paid',
          description: `You've paid off ${pct(m.progressPct)} of your mortgage principal. Est. payoff: ${m.payoffDate}.`,
          metric: 'Mortgage Progress',
          value: pct(m.progressPct),
          trend: 'improving',
          actionable: false,
          category: 'mortgage',
          createdAt: now,
        });
      }

      insights.push({
        id: insightId(),
        type: 'mortgage',
        severity: 'positive',
        title: 'Interest savings on track',
        description: `Extra payments have saved you ${fmt(m.interestSaved)} in interest so far.`,
        metric: 'Interest Saved',
        value: fmt(m.interestSaved),
        trend: 'improving',
        actionable: false,
        category: 'mortgage',
        createdAt: now,
      });
    }
  }

  return insights;
}

// ============================================================================
// NET WORTH INSIGHTS
// ============================================================================

function generateNetWorthInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const insights: AiInsight[] = [];

  const nwTrend = d.financialHealth?.trends?.netWorth;
  if (nwTrend && nwTrend.direction === 'improving') {
    insights.push({
      id: insightId(),
      type: 'net_worth',
      severity: 'positive',
      title: 'Net worth growing',
      description: `Your net worth is trending upward (+${pct(Math.abs(nwTrend.changePercent))}).`,
      metric: 'Net Worth Trend',
      value: `${nwTrend.changePercent > 0 ? '+' : ''}${pct(nwTrend.changePercent)}`,
      trend: 'improving',
      actionable: false,
      category: 'net_worth',
      createdAt: now,
    });
  } else if (nwTrend && nwTrend.direction === 'declining') {
    insights.push({
      id: insightId(),
      type: 'net_worth',
      severity: 'neutral',
      title: 'Net worth declining',
      description: `Your net worth has decreased by ${pct(Math.abs(nwTrend.changePercent))} recently.`,
      metric: 'Net Worth Trend',
      value: `${nwTrend.changePercent > 0 ? '+' : ''}${pct(nwTrend.changePercent)}`,
      trend: 'declining',
      actionable: true,
      category: 'net_worth',
      createdAt: now,
    });
  }

  if (d.netWorth > 0 && d.totalLiabilities > 0) {
    const debtRatio = (d.totalLiabilities / d.totalAssets) * 100;
    if (debtRatio < 30) {
      insights.push({
        id: insightId(),
        type: 'net_worth',
        severity: 'positive',
        title: 'Healthy debt-to-asset ratio',
        description: `Your debt is ${pct(debtRatio)} of total assets. This is well within healthy range.`,
        metric: 'Debt Ratio',
        value: pct(debtRatio),
        trend: 'stable',
        actionable: false,
        category: 'net_worth',
        createdAt: now,
      });
    }
  }

  return insights;
}

// ============================================================================
// SAVINGS RECOMMENDATIONS
// ============================================================================

function generateSavingsRecommendations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  if (summary.savingsRate < 10) {
    const targetSavings = summary.monthlyIncome * 0.2;
    const gap = targetSavings - (summary.monthlyIncome - summary.monthlyExpenses);
    recs.push({
      id: recId(),
      title: 'Increase savings rate to 20%',
      description: `Your current savings rate is ${pct(summary.savingsRate)}, well below the recommended 20%.`,
      priority: summary.savingsRate < 5 ? 'critical' : 'high',
      category: 'savings',
      estimatedImpact: `Build an extra ${fmt(targetSavings * 12)} in annual savings`,
      confidence: 90,
      actionLabel: 'Set up auto-savings',
      reasoning: `Saving ${pct(summary.savingsRate)} leaves little room for emergencies. A 20% rate builds wealth faster.`,
      supportingData: `Target: ${fmt(targetSavings)}/mo. Current: ${fmt(summary.monthlyIncome - summary.monthlyExpenses)}/mo.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  } else if (summary.savingsRate < 20) {
    const boostAmount = Math.round(summary.monthlyIncome * 0.05);
    recs.push({
      id: recId(),
      title: `Boost savings by ${fmt(boostAmount)}/month`,
      description: `You're saving ${pct(summary.savingsRate)}. Adding ${fmt(boostAmount)}/mo gets you to the 20% target.`,
      priority: 'medium',
      category: 'savings',
      estimatedImpact: `${fmt(boostAmount * 12)} more per year`,
      confidence: 85,
      actionLabel: 'Increase contributions',
      reasoning: `A 5% increase in savings rate adds ${fmt(boostAmount * 12)} annually to your wealth.`,
      supportingData: `Current rate: ${pct(summary.savingsRate)}. Target: 20%.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

// ============================================================================
// BUDGET RECOMMENDATIONS
// ============================================================================

function generateBudgetRecommendations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const overBudget = d.budgetUtilization.filter((c) => c.percentUsed > 100);
  for (const cat of overBudget.slice(0, 3)) {
    const overspend = cat.spent - cat.budgeted;
    const reductionTarget = Math.round(overspend * 0.5);
    recs.push({
      id: recId(),
      title: `Reduce ${cat.categoryName} spending by ${fmt(reductionTarget)}/mo`,
      description: `${cat.categoryName} is over budget by ${fmt(overspend)} (${pct(cat.percentUsed)} used).`,
      priority: cat.percentUsed > 120 ? 'critical' : 'high',
      category: 'budget',
      estimatedImpact: `Save ~${fmt(reductionTarget * 12)} per year`,
      confidence: 85,
      actionLabel: `Adjust ${cat.categoryName} budget`,
      reasoning: `Currently spending ${fmt(cat.spent)} against ${fmt(cat.budgeted)} budget. A 50% reduction in overspend gets you back on track.`,
      supportingData: `Budget: ${fmt(cat.budgeted)}. Spent: ${fmt(cat.spent)}. Overspend: ${fmt(overspend)}.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

// ============================================================================
// MORTGAGE RECOMMENDATIONS
// ============================================================================

function generateMortgageRecommendations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  if (d.mortgages.length > 0) {
    const m = d.mortgages[0];
    if (m && summary.cashFlow > 200) {
      const extraPayment = Math.min(summary.cashFlow * 0.2, m.remainingBalance * 0.01);
      recs.push({
        id: recId(),
        title: `Pay ${fmt(extraPayment)} extra on mortgage monthly`,
        description: `Adding ${fmt(extraPayment)}/mo to your mortgage payment reduces total interest and accelerates payoff.`,
        priority: 'medium',
        category: 'mortgage',
        estimatedImpact: `Save thousands in interest, pay off years earlier`,
        confidence: 80,
        actionLabel: 'Schedule extra payment',
        reasoning: `Extra payments go directly to principal, reducing total interest over the loan term.`,
        supportingData: `Current payment: ${fmt(m.monthlyPayment)}. Proposed extra: ${fmt(extraPayment)}/mo.`,
        dismissed: false,
        applied: false,
        createdAt: now,
      });
    }
  }

  return recs;
}

// ============================================================================
// SPENDING RECOMMENDATIONS
// ============================================================================

function generateSpendingRecommendations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  const totalSpending = d.topSpendingCategories.reduce((s, c) => s + c.amount, 0) || 1;

  for (const cat of d.topSpendingCategories.slice(0, 2)) {
    const catPct = (cat.amount / totalSpending) * 100;
    if (catPct > 25 && cat.categoryName !== 'Housing') {
      const reduction = Math.round(cat.amount * 0.1);
      recs.push({
        id: recId(),
        title: `Optimize ${cat.categoryName} spending`,
        description: `Reduce ${cat.categoryName} by ${fmt(reduction)}/mo (10% cut).`,
        priority: catPct > 35 ? 'medium' : 'low',
        category: 'spending',
        estimatedImpact: `Save ~${fmt(reduction * 12)} per year`,
        confidence: 70,
        actionLabel: 'Review spending',
        reasoning: `${cat.categoryName} makes up ${pct(catPct)} of total spending. Even a small reduction compounds.`,
        supportingData: `Current: ${fmt(cat.amount)}/mo. 10% reduction: ${fmt(reduction)}/mo.`,
        dismissed: false,
        applied: false,
        createdAt: now,
      });
    }
  }

  return recs;
}

// ============================================================================
// CASH FLOW RECOMMENDATIONS
// ============================================================================

function generateCashFlowRecommendations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  if (summary.cashFlow < 0) {
    recs.push({
      id: recId(),
      title: 'Address negative cash flow immediately',
      description: `You're spending ${fmt(Math.abs(summary.cashFlow))} more than you earn. This is unsustainable.`,
      priority: 'critical',
      category: 'cash_flow',
      estimatedImpact: `Stop ${fmt(Math.abs(summary.cashFlow) * 12)} in annual deficit`,
      confidence: 95,
      actionLabel: 'Review expenses',
      reasoning: `Negative cash flow depletes savings and increases debt. Prioritize expense reduction.`,
      supportingData: `Income: ${fmt(summary.monthlyIncome)}. Expenses: ${fmt(summary.monthlyExpenses)}. Gap: ${fmt(summary.cashFlow)}.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

function detectAchievements(d: DashboardSummaryData, now: string): AiAchievement[] {
  const achievements: AiAchievement[] = [];

  if (d.savingsRate >= 20) {
    achievements.push({
      id: `ach_savings_20_${Date.now()}`,
      title: 'Savings Star',
      description: `You're saving ${pct(d.savingsRate)} of your income, exceeding the 20% target.`,
      metric: 'Savings Rate',
      value: pct(d.savingsRate),
      icon: 'star',
      unlockedAt: now,
    });
  }

  if (d.netWorth > 0) {
    achievements.push({
      id: `ach_networth_positive_${Date.now()}`,
      title: 'Net Worth Positive',
      description: `Your net worth is ${fmt(d.netWorth)}. You own more than you owe.`,
      metric: 'Net Worth',
      value: fmt(d.netWorth),
      icon: 'trophy',
      unlockedAt: now,
    });
  }

  const overBudget = d.budgetUtilization.filter((c) => c.percentUsed > 100);
  if (d.budgetSnapshot.onTrack > 0 && overBudget.length === 0) {
    achievements.push({
      id: `ach_budget_perfect_${Date.now()}`,
      title: 'Budget Master',
      description: `All ${d.budgetSnapshot.onTrack} budget categories are within limits.`,
      metric: 'On Track',
      value: `${d.budgetSnapshot.onTrack}/${d.budgetSnapshot.onTrack}`,
      icon: 'check',
      unlockedAt: now,
    });
  }

  if (d.financialHealth?.overallScore !== undefined && d.financialHealth.overallScore >= 80) {
    achievements.push({
      id: `ach_health_80_${Date.now()}`,
      title: 'Financial Health Champion',
      description: `Your financial health score is ${d.financialHealth.overallScore}/100.`,
      metric: 'Health Score',
      value: `${d.financialHealth.overallScore}`,
      icon: 'heart',
      unlockedAt: now,
    });
  }

  if (d.savingsSnapshot.activeGoals > 0 && d.savingsSnapshot.goalCompletionPct >= 100) {
    const totalTarget = d.savingsSnapshot.goalCompletionPct > 0
      ? Math.round(d.savingsSnapshot.totalSaved / (d.savingsSnapshot.goalCompletionPct / 100))
      : d.savingsSnapshot.totalSaved;
    achievements.push({
      id: `ach_goal_complete_${Date.now()}`,
      title: 'Goal Achiever',
      description: `You've reached your savings goal of ${fmt(totalTarget)}.`,
      metric: 'Goal',
      value: fmt(totalTarget),
      icon: 'target',
      unlockedAt: now,
    });
  }

  return achievements;
}

// ============================================================================
// WARNINGS
// ============================================================================

function detectWarnings(d: DashboardSummaryData, now: string): AiWarning[] {
  const warnings: AiWarning[] = [];

  if (summaryHasNegativeCashFlow(d)) {
    warnings.push({
      id: `warn_negative_cf_${Date.now()}`,
      title: 'Negative Cash Flow',
      message: `You're spending more than you earn. This depletes savings and increases debt.`,
      severity: 'critical',
      category: 'cash_flow',
      suggestedAction: 'Review and reduce non-essential expenses immediately.',
      createdAt: now,
    });
  }

  const overBudget = d.budgetUtilization.filter((c) => c.percentUsed > 120);
  for (const cat of overBudget.slice(0, 2)) {
    warnings.push({
      id: `warn_budget_${cat.categoryId}_${Date.now()}`,
      title: `Budget exceeded: ${cat.categoryName}`,
      message: `${cat.categoryName} is at ${pct(cat.percentUsed)} of its budget. ${fmt(cat.spent - cat.budgeted)} overspent.`,
      severity: cat.percentUsed > 150 ? 'critical' : 'high',
      category: 'budget',
      suggestedAction: `Review ${cat.categoryName} spending and adjust your budget.`,
      createdAt: now,
    });
  }

  if (d.savingsRate < 5 && d.savingsRate >= 0) {
    warnings.push({
      id: `warn_low_savings_${Date.now()}`,
      title: 'Very Low Savings Rate',
      message: `Your savings rate is only ${pct(d.savingsRate)}. This leaves no buffer for emergencies.`,
      severity: 'high',
      category: 'savings',
      suggestedAction: 'Aim to save at least 10% of income.',
      createdAt: now,
    });
  }

  const upcomingBills = d.upcomingActivity.filter((a) => a.type === 'expense');
  if (upcomingBills.length > 0) {
    const totalBills = upcomingBills.reduce((s, a) => s + Math.abs(a.amount), 0);
    if (totalBills > d.availableCash * 0.5 && d.availableCash > 0) {
      warnings.push({
        id: `warn_upcoming_bills_${Date.now()}`,
        title: 'Large upcoming bills',
        message: `You have ${fmt(totalBills)} in bills due soon, which is ${pct((totalBills / d.availableCash) * 100)} of available cash.`,
        severity: 'medium',
        category: 'cash_flow',
        suggestedAction: 'Ensure sufficient funds are available for upcoming payments.',
        createdAt: now,
      });
    }
  }

  return warnings;
}

function summaryHasNegativeCashFlow(d: DashboardSummaryData): boolean {
  return d.cashFlow < 0;
}

// ============================================================================
// SAVINGS OPPORTUNITIES
// ============================================================================

function generateSavingsOpportunities(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  if (summary.cashFlow > 100) {
    const surplusAllocation = Math.round(summary.cashFlow * 0.3);
    recs.push({
      id: recId(),
      title: `Allocate ${fmt(surplusAllocation)}/mo to savings`,
      description: `You have ${fmt(summary.cashFlow)} monthly surplus. Allocating 30% accelerates your goals.`,
      priority: 'medium',
      category: 'savings',
      estimatedImpact: `${fmt(surplusAllocation * 12)} more savings per year`,
      confidence: 80,
      actionLabel: 'Set up auto-transfer',
        reasoning: `Your surplus is unallocated potential. Earning even 4% APY on ${fmt(surplusAllocation)}/mo adds ${fmt(Math.round(surplusAllocation * 12 * 0.04))} in interest.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  if (d.savingsSnapshot.activeGoals > 0) {
    const avgMonthlyNeeded = summary.totalTarget / 12;
    if (summary.cashFlow > avgMonthlyNeeded) {
      recs.push({
        id: recId(),
        title: 'Accelerate savings goal contributions',
        description: `With your current surplus, you can increase monthly contributions and reach goals faster.`,
        priority: 'low',
        category: 'savings',
        estimatedImpact: 'Reach goals months earlier',
        confidence: 75,
        actionLabel: 'Increase contributions',
        reasoning: `Higher contributions compound over time, reaching goals sooner with less total interest paid.`,
        dismissed: false,
        applied: false,
        createdAt: now,
      });
    }
  }

  return recs;
}

// ============================================================================
// DEBT OPPORTUNITIES
// ============================================================================

function generateDebtOpportunities(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  if (d.mortgages.length > 0 && summary.cashFlow > 200) {
    const m = d.mortgages[0];
    if (m) {
      const extraPayment = Math.min(summary.cashFlow * 0.15, m.remainingBalance * 0.005);
      recs.push({
        id: recId(),
        title: `Add ${fmt(extraPayment)}/mo to mortgage principal`,
        description: `Extra payments reduce total interest and shorten your mortgage term.`,
        priority: 'medium',
        category: 'mortgage',
        estimatedImpact: `Save thousands in interest over the loan life`,
        confidence: 80,
        actionLabel: 'Set up extra payment',
        reasoning: `Even small extra payments compound significantly over 15-30 years.`,
        supportingData: `Current remaining: ${fmt(m.remainingBalance)}. Extra: ${fmt(extraPayment)}/mo.`,
        dismissed: false,
        applied: false,
        createdAt: now,
      });
    }
  }

  if (d.accountSummary.creditCards > 0 && summary.cashFlow > 0) {
    recs.push({
      id: recId(),
      title: 'Pay off credit card debt first',
      description: `Credit card debt typically has 15-25% APR. Paying it off first saves the most interest.`,
      priority: summary.cashFlow > 500 ? 'high' : 'medium',
      category: 'debt',
      estimatedImpact: `Avoid ${fmt(d.accountSummary.creditCards * 0.2)}/yr in interest`,
      confidence: 85,
      actionLabel: 'Review credit card balances',
      reasoning: `Credit card interest compounds daily. Every dollar paid off saves 15-25% annually.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

// ============================================================================
// BUDGET OPTIMIZATIONS
// ============================================================================

function generateBudgetOptimizations(d: DashboardSummaryData, summary: AiFinancialSummary, now: string): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const nearLimit = d.budgetUtilization.filter((c) => c.percentUsed >= 75 && c.percentUsed < 100);
  for (const cat of nearLimit.slice(0, 2)) {
    recs.push({
      id: recId(),
      title: `Watch ${cat.categoryName} spending`,
      description: `${cat.categoryName} is at ${pct(cat.percentUsed)} of its budget. ${fmt(cat.remaining)} remaining.`,
      priority: 'low',
      category: 'budget',
      estimatedImpact: `Stay within ${fmt(cat.budgeted)} monthly budget`,
      confidence: 70,
      actionLabel: 'Monitor spending',
      reasoning: `Being proactive prevents budget overruns. Consider reducing discretionary spending in this category.`,
      supportingData: `Budget: ${fmt(cat.budgeted)}. Remaining: ${fmt(cat.remaining)}.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  if (d.budgetSnapshot.monthlyUsagePct > 0 && d.budgetSnapshot.monthlyUsagePct < 70) {
    recs.push({
      id: recId(),
      title: 'Consider reallocating unused budget',
      description: `Overall budget usage is ${pct(d.budgetSnapshot.monthlyUsagePct)}. Some categories may have room for reallocation.`,
      priority: 'low',
      category: 'budget',
      estimatedImpact: 'Better resource allocation',
      confidence: 60,
      actionLabel: 'Review budget allocation',
      reasoning: `Under-utilized budgets could be redirected to savings or debt reduction.`,
      dismissed: false,
      applied: false,
      createdAt: now,
    });
  }

  return recs;
}

// ============================================================================
// TREND INSIGHTS
// ============================================================================

function generateTrendInsights(d: DashboardSummaryData, now: string): AiInsight[] {
  const trends: AiInsight[] = [];

  const healthTrend = d.financialHealth?.trends?.healthScore;
  if (healthTrend) {
    const direction = healthTrend.direction as 'improving' | 'stable' | 'declining';
    trends.push({
      id: insightId(),
      type: 'trend',
      severity: direction === 'improving' ? 'positive' : direction === 'declining' ? 'negative' : 'neutral',
      title: `Health Score: ${healthTrend.direction}`,
      description: `Your financial health score is ${healthTrend.direction} by ${pct(Math.abs(healthTrend.changePercent))}.`,
      metric: 'Health Score',
      value: `${direction === 'improving' ? '+' : ''}${pct(healthTrend.changePercent)}`,
      trend: direction,
      actionable: direction === 'declining',
      category: 'health',
      createdAt: now,
    });
  }

  const savingsTrend = d.financialHealth?.trends?.savings;
  if (savingsTrend) {
    const direction = savingsTrend.direction as 'improving' | 'stable' | 'declining';
    trends.push({
      id: insightId(),
      type: 'trend',
      severity: direction === 'improving' ? 'positive' : direction === 'declining' ? 'negative' : 'neutral',
      title: `Savings: ${savingsTrend.direction}`,
      description: `Your savings trend is ${savingsTrend.direction} by ${pct(Math.abs(savingsTrend.changePercent))}.`,
      metric: 'Savings Trend',
      value: `${direction === 'improving' ? '+' : ''}${pct(savingsTrend.changePercent)}`,
      trend: direction,
      actionable: false,
      category: 'savings',
      createdAt: now,
    });
  }

  return trends;
}

// ============================================================================
// CASH FLOW FORECAST
// ============================================================================

function generateCashFlowForecast(d: DashboardSummaryData): Array<{ month: string; projected: number; trend: 'positive' | 'negative' | 'stable' }> {
  const forecast: Array<{ month: string; projected: number; trend: 'positive' | 'negative' | 'stable' }> = [];
  const now = new Date();
  let runningBalance = d.availableCash;

  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthlyNet = d.monthlyIncome - d.monthlyExpenses;
    runningBalance += monthlyNet;

    forecast.push({
      month: monthLabel,
      projected: Math.round(runningBalance),
      trend: monthlyNet > 0 ? 'positive' : monthlyNet < 0 ? 'negative' : 'stable',
    });
  }

  return forecast;
}
