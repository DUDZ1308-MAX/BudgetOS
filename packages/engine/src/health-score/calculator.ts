import { computeSavingsRateScore } from './components/savings-rate';
import { computeDTIScore } from './components/dti';
import { computeEmergencyFundScore } from './components/emergency-fund';
import { computeBudgetAdherenceScore } from './components/budget-adherence';
import { computeNetWorthTrendScore } from './components/net-worth-trend';
import type { FHSRequest, FHSResult } from './types';
import type { FHSTier } from '@budgetos/shared';

export function computeScore(request: FHSRequest): FHSResult {
  const savingsRateScore = computeSavingsRateScore(request.totalSavingsMonthly, request.totalIncomeMonthly);
  const dtiScore = computeDTIScore(request.totalDebtPaymentsMonthly, request.totalIncomeMonthly);
  const emergencyFundScore = computeEmergencyFundScore(request.emergencyFundBalance, request.monthlyExpenses);
  const budgetAdherenceScore = computeBudgetAdherenceScore(request.budgets, request.actualSpending);
  const netWorthTrendScore = computeNetWorthTrendScore(request.currentNetWorth, request.netWorthThreeMonthsAgo);

  const totalScore = Math.round(
    savingsRateScore.earnedPoints +
    dtiScore.earnedPoints +
    emergencyFundScore.earnedPoints +
    budgetAdherenceScore.earnedPoints +
    netWorthTrendScore.earnedPoints,
  );

  const overallScore = Math.min(100, Math.max(0, totalScore));
  const tier = computeTier(overallScore);

  const recommendations = generateRecommendations({
    savingsRateScore,
    dtiScore,
    emergencyFundScore,
    budgetAdherenceScore,
    netWorthTrendScore,
  });

  return {
    overallScore,
    tier,
    components: {
      savingsRate: savingsRateScore,
      debtToIncome: dtiScore,
      emergencyFund: emergencyFundScore,
      budgetAdherence: budgetAdherenceScore,
      netWorthTrend: netWorthTrendScore,
    },
    recommendations,
  };
}

function computeTier(score: number): FHSTier {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'concerning';
  return 'critical';
}

interface AllScores {
  savingsRateScore: { earnedPoints: number; maxPoints: number; details: string };
  dtiScore: { earnedPoints: number; maxPoints: number; details: string };
  emergencyFundScore: { earnedPoints: number; maxPoints: number; details: string };
  budgetAdherenceScore: { earnedPoints: number; maxPoints: number; details: string };
  netWorthTrendScore: { earnedPoints: number; maxPoints: number; details: string };
}

function generateRecommendations(scores: AllScores): string[] {
  const recommendations: string[] = [];

  if (scores.savingsRateScore.earnedPoints < scores.savingsRateScore.maxPoints * 0.5) {
    recommendations.push('Increase your savings rate. Aim to save at least 20% of your income.');
  }

  if (scores.dtiScore.earnedPoints < scores.dtiScore.maxPoints * 0.5) {
    recommendations.push('Your debt-to-income ratio is high. Consider a debt consolidation plan or increasing debt payments.');
  }

  if (scores.emergencyFundScore.earnedPoints < scores.emergencyFundScore.maxPoints * 0.5) {
    recommendations.push('Build your emergency fund to 3-6 months of expenses before increasing investments.');
  }

  if (scores.budgetAdherenceScore.earnedPoints < scores.budgetAdherenceScore.maxPoints * 0.5) {
    recommendations.push('Review your budget categories. You are exceeding your targets in several areas.');
  }

  if (scores.netWorthTrendScore.earnedPoints === 0) {
    recommendations.push('Your net worth is declining. Review large expenses and focus on reducing debt.');
  }

  return recommendations;
}
