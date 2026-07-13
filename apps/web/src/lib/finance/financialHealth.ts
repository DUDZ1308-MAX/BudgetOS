import { calculateTotalAssets, calculateTotalLiabilities, type AccountInput } from './accounts';
import { sumIncome, sumExpenses, type TransactionInput } from './transactions';
import { calculateBudgetAdherence, type CategoryBudgetBreakdown } from './budget';

export interface FinancialHealthFactors {
  savingsRate: number;
  debtToIncome: number;
  emergencyFundMonths: number;
  budgetAdherence: number;
  netWorthTrend: number;
}

export interface FinancialHealthScore {
  overallScore: number;
  factors: {
    savingsRate: { score: number; weight: number; maxScore: number };
    budgetAdherence: { score: number; weight: number; maxScore: number };
    emergencyFund: { score: number; weight: number; maxScore: number };
    debtToIncome: { score: number; weight: number; maxScore: number };
    spendingConsistency: { score: number; weight: number; maxScore: number };
  };
  breakdown: string[];
}

export function calculateSavingsRate(
  income: number,
  savings: number,
): number {
  if (income <= 0) return 0;
  return Math.round((savings / income) * 100 * 100) / 100;
}

export function calculateDebtToIncome(
  totalLiabilities: number,
  monthlyIncome: number,
): number {
  const annualIncome = monthlyIncome * 12;
  if (annualIncome <= 0) return 0;
  return Math.round((totalLiabilities / annualIncome) * 100 * 100) / 100;
}

export function calculateEmergencyFundMonths(
  totalAssets: number,
  monthlyExpenses: number,
): number {
  if (monthlyExpenses <= 0) return 0;
  return Math.round((totalAssets / monthlyExpenses) * 100) / 100;
}

export function calculateNetWorthTrend(
  recentNetWorth: number[],
): number {
  if (recentNetWorth.length < 2) return 0;
  const first = recentNetWorth[0]!;
  const last = recentNetWorth[recentNetWorth.length - 1]!;
  if (first === 0) return 0;
  return Math.round(((last - first) / Math.abs(first)) * 100 * 100) / 100;
}

export function computeSavingsRateScore(savingsRate: number): number {
  if (savingsRate >= 20) return 100;
  if (savingsRate >= 15) return 80;
  if (savingsRate >= 10) return 60;
  if (savingsRate >= 5) return 40;
  if (savingsRate > 0) return 20;
  return 0;
}

export function computeEmergencyFundScore(monthsCovered: number): number {
  if (monthsCovered >= 6) return 100;
  if (monthsCovered >= 3) return 70;
  if (monthsCovered >= 1) return 40;
  return Math.max(0, Math.round(monthsCovered * 40));
}

export function computeDebtToIncomeScore(dtiRatio: number): number {
  if (dtiRatio <= 0) return 100;
  if (dtiRatio <= 0.36) return 80;
  if (dtiRatio <= 0.43) return 50;
  if (dtiRatio <= 0.5) return 30;
  return Math.max(0, Math.round(100 - dtiRatio * 100));
}

export function computeBudgetAdherenceScore(budgetStatuses: CategoryBudgetBreakdown[]): number {
  return calculateBudgetAdherence(budgetStatuses);
}

export function computeSpendingConsistencyScore(
  amounts: number[],
): number {
  if (amounts.length < 3) return 50;
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  if (avg === 0) return 50;
  const variance = amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg;
  if (cv < 0.5) return 90;
  if (cv < 1) return 70;
  if (cv < 1.5) return 50;
  return 30;
}

export function computeFinancialHealthScore(
  income: number,
  expenses: number,
  savings: number,
  totalLiabilities: number,
  totalAssets: number,
  monthlyExpenses: number,
  budgetStatuses: CategoryBudgetBreakdown[],
  transactionAmounts: number[],
): FinancialHealthScore {
  const savingsRate = calculateSavingsRate(income, savings);
  const dtiRatio = calculateDebtToIncome(totalLiabilities, income / 12);
  const emergencyFund = calculateEmergencyFundMonths(totalAssets, monthlyExpenses);

  const savingsScore = computeSavingsRateScore(savingsRate);
  const budgetScore = computeBudgetAdherenceScore(budgetStatuses);
  const emergencyScore = computeEmergencyFundScore(emergencyFund);
  const dtiScore = computeDebtToIncomeScore(dtiRatio);
  const spendingScore = computeSpendingConsistencyScore(transactionAmounts);

  const factors = {
    savingsRate: { score: savingsScore, weight: 25, maxScore: 100 },
    budgetAdherence: { score: budgetScore, weight: 20, maxScore: 100 },
    emergencyFund: { score: emergencyScore, weight: 20, maxScore: 100 },
    debtToIncome: { score: dtiScore, weight: 20, maxScore: 100 },
    spendingConsistency: { score: spendingScore, weight: 15, maxScore: 100 },
  };

  const totalWeighted = Object.values(factors).reduce(
    (sum, f) => sum + f.score * f.weight / f.maxScore,
    0,
  );
  const totalWeight = Object.values(factors).reduce((sum, f) => sum + f.weight, 0);
  const overallScore = Math.round(Math.max(0, Math.min(100, totalWeighted / totalWeight * 100)));

  const breakdown: string[] = [];
  if (savingsScore < 60) breakdown.push(`Savings rate of ${savingsRate}% is below recommended 20%.`);
  if (emergencyScore < 70) breakdown.push(`Emergency fund covers ${emergencyFund} months (target: 3-6).`);
  if (dtiScore < 50) breakdown.push(`Debt-to-income ratio of ${dtiRatio}% is elevated.`);
  if (budgetScore < 70) breakdown.push(`${Math.round(100 - budgetScore)}% of budgets are over budget.`);
  if (spendingScore < 50) breakdown.push('Spending is highly variable month to month.');

  return { overallScore, factors, breakdown };
}
