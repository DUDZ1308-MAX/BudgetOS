import type { SafeToSpendInput, SafeToSpendResult } from '../types';

export function computeSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const {
    remainingBudget,
    monthlyIncome,
    daysRemaining,
    upcomingFixedExpenses = 0,
  } = input;

  const safetyBuffer = monthlyIncome * 0.1;
  const afterReserves = remainingBudget - upcomingFixedExpenses - safetyBuffer;

  const safeToSpendToday = daysRemaining > 0
    ? Math.max(0, afterReserves / daysRemaining)
    : 0;

  let riskLevel: 'low' | 'medium' | 'high';
  let explanation: string;

  if (remainingBudget <= 0) {
    riskLevel = 'high';
    explanation = `No remaining budget. You have already spent or exceeded your budget.`;
  } else if (safeToSpendToday <= 0) {
    riskLevel = 'high';
    explanation = `After reserving $${safetyBuffer.toFixed(2)} for safety, nothing remains for discretionary spending.`;
  } else if (safeToSpendToday < remainingBudget / daysRemaining * 0.5) {
    riskLevel = 'medium';
    explanation = `You can safely spend $${safeToSpendToday.toFixed(2)} per day. A ${upcomingFixedExpenses > 0 ? '$' + upcomingFixedExpenses.toFixed(2) + ' fixed expense reduces' : '10% safety buffer reduces'} your available funds.`;
  } else {
    riskLevel = 'low';
    explanation = `You can safely spend $${safeToSpendToday.toFixed(2)} per day for the remaining ${daysRemaining} days.`;
  }

  return {
    safeToSpendToday: Math.round(safeToSpendToday * 100) / 100,
    riskLevel,
    explanation,
  };
}
