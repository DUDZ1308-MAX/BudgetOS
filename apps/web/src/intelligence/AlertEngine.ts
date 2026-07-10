import type { ProactiveAlert, IntelligenceInput, AlertSeverity, AlertCategory } from './types';

let alertCounter = 0;

function nextId(): string {
  alertCounter++;
  return `alert_${Date.now()}_${alertCounter}`;
}

export function generateAlerts(input: IntelligenceInput): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  const now = new Date().toISOString();

  alerts.push(...generateBudgetAlerts(input, now));
  alerts.push(...generateCashFlowAlerts(input, now));
  alerts.push(...generateSpendingAlerts(input, now));
  alerts.push(...generateSavingsAlerts(input, now));
  alerts.push(...generateMortgageAlerts(input, now));

  return alerts;
}

function generateBudgetAlerts(input: IntelligenceInput, now: string): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  for (const cat of input.budgetSummary.budgetStatus.overBudget) {
    const overspent = cat.spent - cat.budgeted;
    alerts.push({
      id: nextId(),
      type: 'budget',
      severity: overspent > cat.budgeted * 0.5 ? 'critical' : 'high',
      title: `Budget exceeded: ${cat.categoryName}`,
      message: `You've exceeded your ${cat.categoryName} budget by $${overspent.toFixed(2)}. Spent $${cat.spent.toFixed(2)} of $${cat.budgeted.toFixed(2)}.`,
      suggestedAction: `Review ${cat.categoryName} spending and adjust your budget.`,
      relatedEntityId: cat.categoryId,
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  for (const cat of input.budgetSummary.budgetStatus.categories) {
    if (cat.percentUsed >= 85 && cat.percentUsed < 100) {
      alerts.push({
        id: nextId(),
        type: 'budget',
        severity: 'medium',
        title: `Budget nearly exhausted: ${cat.categoryName}`,
        message: `${cat.categoryName} is at ${Math.round(cat.percentUsed)}% of its $${cat.budgeted.toFixed(2)} budget. $${cat.remaining.toFixed(2)} remaining.`,
        suggestedAction: `Reduce spending in ${cat.categoryName} for the rest of the month.`,
        relatedEntityId: cat.categoryId,
        timestamp: now,
        read: false,
        dismissed: false,
      });
    }
  }

  return alerts;
}

function generateCashFlowAlerts(input: IntelligenceInput, now: string): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  const { cashFlow } = input.budgetSummary;

  if (cashFlow.projectedEndBalance < 0) {
    alerts.push({
      id: nextId(),
      type: 'cashflow',
      severity: 'critical',
      title: 'Projected negative balance',
      message: `Your projected end-of-month balance is -$${Math.abs(cashFlow.projectedEndBalance).toFixed(2)}. Consider reducing expenses.`,
      suggestedAction: 'Review your upcoming expenses and cut discretionary spending.',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  if (cashFlow.netIncome <= 0 && input.budgetSummary.income.total > 0) {
    alerts.push({
      id: nextId(),
      type: 'cashflow',
      severity: 'high',
      title: 'Spending matches income',
      message: `Your expenses ($${input.budgetSummary.expenses.total.toFixed(2)}) are consuming all your income ($${input.budgetSummary.income.total.toFixed(2)}).`,
      suggestedAction: 'Aim to save at least 10-20% of your income.',
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  return alerts;
}

function generateSpendingAlerts(input: IntelligenceInput, now: string): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  for (const txn of input.transactions) {
    const avgForCategory = input.budgetSummary.expenses.byCategory.find(
      (c) => c.categoryName === txn.category,
    );
    if (avgForCategory && avgForCategory.transactionCount > 0) {
      const avgAmount = avgForCategory.amount / avgForCategory.transactionCount;
      if (Math.abs(txn.amount) > avgAmount * 3 && Math.abs(txn.amount) > 100) {
        alerts.push({
          id: nextId(),
          type: 'spending',
          severity: 'medium',
          title: 'Large unusual transaction',
          message: `A ${txn.merchant ? `${txn.merchant} ` : ''}transaction of $${Math.abs(txn.amount).toFixed(2)} is significantly higher than your average.`,
          suggestedAction: 'Verify this transaction and review for potential errors.',
          relatedEntityId: txn.id,
          timestamp: now,
          read: false,
          dismissed: false,
        });
      }
    }
  }

  return alerts;
}

function generateSavingsAlerts(input: IntelligenceInput, now: string): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  for (const goal of input.savingsGoals) {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    if (target <= 0) continue;

    if (current >= target) {
      alerts.push({
        id: nextId(),
        type: 'achievement',
        severity: 'low',
        title: `Savings goal achieved: ${goal.name}`,
        message: `Congratulations! You've reached your savings goal of $${target.toFixed(2)} for "${goal.name}".`,
        suggestedAction: 'Consider setting a new savings goal or reallocating these funds.',
        relatedEntityId: goal.id,
        timestamp: now,
        read: false,
        dismissed: false,
      });
    } else if (current >= target * 0.9) {
      alerts.push({
        id: nextId(),
        type: 'milestone',
        severity: 'low',
        title: `Almost there: ${goal.name}`,
        message: `You're at ${Math.round((current / target) * 100)}% of your "${goal.name}" savings goal. Just $${(target - current).toFixed(2)} to go!`,
        relatedEntityId: goal.id,
        timestamp: now,
        read: false,
        dismissed: false,
      });
    }
  }

  return alerts;
}

function generateMortgageAlerts(input: IntelligenceInput, now: string): ProactiveAlert[] {
  if (!input.mortgageData) return [];

  const alerts: ProactiveAlert[] = [];

  if (input.mortgageData.progressPct >= 50 && input.mortgageData.progressPct < 55) {
    alerts.push({
      id: nextId(),
      type: 'milestone',
      severity: 'low',
      title: 'Mortgage milestone: 50% paid',
      message: `You've paid off 50% of your mortgage principal. Keep it up!`,
      timestamp: now,
      read: false,
      dismissed: false,
    });
  }

  return alerts;
}
