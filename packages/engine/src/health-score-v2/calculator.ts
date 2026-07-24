import { computeSpendingScore } from './components/spending';
import { computeSavingsScore } from './components/savings';
import { computeDebtScore } from './components/debt';
import { computeCashFlowScore } from './components/cash-flow';
import { computeEmergencyFundScore } from './components/emergency-fund';
import { computeBudgetAdherenceScore } from './components/budget-adherence';
import { computeNetWorthGrowthScore } from './components/net-worth-growth';
import type { HealthScoreRequest, HealthScoreResult } from './types';
import { computeLetterGrade } from './utils';

export function computeHealthScoreV2(request: HealthScoreRequest): HealthScoreResult {
  const spending = computeSpendingScore(request.totalIncomeMonthly, request.monthlyExpenses, request.spendingHistory);
  const savings = computeSavingsScore(request.totalSavingsMonthly, request.totalIncomeMonthly, request.savingsHistory);
  const debt = computeDebtScore(
    request.totalDebtPaymentsMonthly, request.totalIncomeMonthly,
    request.creditCardBalances, request.mortgageBalance,
    request.totalAssets, request.netWorthHistory,
  );
  const cashFlow = computeCashFlowScore(request.cashFlow, request.totalIncomeMonthly, request.cashFlowHistory);
  const emergencyFund = computeEmergencyFundScore(request.emergencyFundBalance, request.monthlyExpenses, request.savingsHistory);
  const budgetAdherence = computeBudgetAdherenceScore(request.budgets, request.actualSpending);
  const netWorthGrowth = computeNetWorthGrowthScore(request.currentNetWorth, request.netWorthThreeMonthsAgo, request.netWorthHistory);

  const totalScore = Math.round(
    spending.score * 0.15 +
    savings.score * 0.15 +
    debt.score * 0.15 +
    cashFlow.score * 0.15 +
    emergencyFund.score * 0.15 +
    budgetAdherence.score * 0.15 +
    netWorthGrowth.score * 0.10,
  );

  const overallScore = Math.min(100, Math.max(0, totalScore));

  return {
    overall: {
      score: overallScore,
      grade: computeLetterGrade(overallScore),
      trend: 'stable',
      explanation: `Your overall financial health score is ${overallScore}/100.`,
    },
    components: {
      spending,
      savings,
      debt,
      cashFlow,
      emergencyFund,
      budgetAdherence,
      netWorthGrowth,
    },
  };
}
