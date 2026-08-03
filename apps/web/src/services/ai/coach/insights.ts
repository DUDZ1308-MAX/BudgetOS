import type { CoachInsight, CoachSnapshotData } from './types';

// ============================================================================
// Proactive insights (Phase 11)
//
// Deterministic, rule-based insights derived exclusively from the authoritative
// snapshot. The AI layer only rephrases these; it never computes the figures.
// Returns at most MAX_INSIGHTS, ranked by severity.
// ============================================================================

const MAX_INSIGHTS = 3;

function buildInsights(s: CoachSnapshotData): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const d = s.dashboard;

  // Forecast risk (critical first).
  const criticalWarnings = s.forecast.warnings.filter((w) => w.severity === 'critical');
  if (criticalWarnings.length > 0) {
    const w = criticalWarnings[0];
    if (w) {
      insights.push({
        id: 'forecast-critical',
        severity: 'critical',
        category: 'forecast',
        title: w.title,
        message: `${w.message} Projected for ${w.date ?? 'the next 90 days'} — the cash-flow forecast flags this risk.`,
      });
    }
  }

  // Over-budget categories.
  const over = d.budgetHealth.categories.filter((c) => c.status === 'over');
  if (over.length > 0) {
    const worst = over.slice().sort((a, b) => b.percentUsed - a.percentUsed)[0];
    if (worst) {
      insights.push({
        id: 'budget-over',
        severity: 'warning',
        category: 'budget',
        title: `${over.length} budget categor${over.length === 1 ? 'y is' : 'ies are'} over budget`,
        message: `Top: ${worst.categoryName} at ${Math.round(worst.percentUsed)}% of its budget ($${worst.spent.toFixed(2)} of $${worst.budgeted.toFixed(2)}).`,
      });
    }
  }

  // Savings goal behind schedule.
  const behind = d.savingsGoals.filter((g) => !g.onTrack && g.percentComplete < 100);
  if (behind.length > 0) {
    const g = behind[0];
    if (g) {
      insights.push({
        id: 'goal-behind',
        severity: 'warning',
        category: 'savings',
        title: `Savings goal "${g.name}" is behind schedule`,
        message: `Currently at ${Math.round(g.percentComplete)}% ($${g.currentAmount.toFixed(2)} of $${g.targetAmount.toFixed(2)}). Review the monthly contribution.`,
      });
    }
  }

  // Spending trend up vs previous month.
  const cur = s.currentMonth;
  const prev = s.previousMonth;
  if (prev.expenses > 0) {
    const changePct = ((cur.expenses - prev.expenses) / prev.expenses) * 100;
    if (changePct >= 15) {
      insights.push({
        id: 'spending-up',
        severity: 'info',
        category: 'spending',
        title: `Spending is up ${Math.round(changePct)}% vs ${prev.label}`,
        message: `${cur.label} expenses ($${cur.expenses.toFixed(2)}) are higher than ${prev.label} ($${prev.expenses.toFixed(2)}).`,
      });
    } else if (changePct <= -15) {
      insights.push({
        id: 'spending-down',
        severity: 'positive',
        category: 'spending',
        title: `Spending is down ${Math.round(Math.abs(changePct))}% vs ${prev.label}`,
        message: `${cur.label} expenses ($${cur.expenses.toFixed(2)}) are lower than ${prev.label} ($${prev.expenses.toFixed(2)}).`,
      });
    }
  }

  // Low savings rate.
  if (d.savingsRate > 0 && d.savingsRate < 10) {
    insights.push({
      id: 'savings-rate-low',
      severity: 'info',
      category: 'health',
      title: 'Savings rate is below 10%',
      message: `Your current savings rate is ${Math.round(d.savingsRate)}% of monthly income. Consider increasing it.`,
    });
  }

  // Low available cash buffer.
  const buffer = s.forecast.ranges[30];
  if (buffer && buffer.lowestBalance > 0 && buffer.lowestBalance < s.forecast.availableCash * 0.25 && s.forecast.availableCash > 0) {
    insights.push({
      id: 'cash-buffer',
      severity: 'info',
      category: 'cashflow',
      title: 'Cash buffer will get thin in the next 30 days',
      message: `Lowest projected balance is $${buffer.lowestBalance.toFixed(2)} on ${buffer.lowestBalanceDate ?? 'a day in the next month'}.`,
    });
  }

  // Mortgage progress positive.
  const mortgage = d.mortgages[0];
  if (mortgage && mortgage.interestSaved > 0) {
    insights.push({
      id: 'mortgage-progress',
      severity: 'positive',
      category: 'mortgage',
      title: `Extra payments are working on "${mortgage.name}"`,
      message: `You have already saved $${mortgage.interestSaved.toFixed(2)} in interest and are ${Math.round(mortgage.progressPct)}% paid off.`,
    });
  }

  // Goal nearing completion (positive).
  const nearing = d.savingsGoals.find((g) => g.onTrack && g.percentComplete >= 75 && g.percentComplete < 100);
  if (nearing) {
    insights.push({
      id: 'goal-nearing',
      severity: 'positive',
      category: 'savings',
      title: `Savings goal "${nearing.name}" is close`,
      message: `You're at ${Math.round(nearing.percentComplete)}% of the target. Estimated completion ${nearing.estimatedCompletionDate ?? 'soon'}.`,
    });
  }

  return insights;
}

export function buildProactiveInsights(s: CoachSnapshotData): CoachInsight[] {
  const severityRank: Record<CoachInsight['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };
  return buildInsights(s)
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, MAX_INSIGHTS);
}
