import type { ProjectionRequest, ProjectionResult } from './types';

export function computeProjections(request: ProjectionRequest): ProjectionResult {
  const monthlyCashFlow = request.monthlyIncome - request.monthlyExpenses;
  const monthlySavingsAmount = request.monthlyIncome * request.savingsRate;
  const monthlyDebtPayment = request.debtPaymentMonthly;

  const periods = [3, 6, 12].map(months => {
    let netWorth = request.currentNetWorth;
    let savings = request.currentSavings;
    let debt = request.currentDebt;
    let emergencyFund = request.emergencyFundBalance;

    for (let m = 0; m < months; m++) {
      const savingsThisMonth = monthlySavingsAmount * (1 + request.expectedReturnRate / 12);
      const debtReduction = Math.min(monthlyDebtPayment, debt);
      const emFundGrowth = monthlyCashFlow * 0.3;

      savings += savingsThisMonth;
      debt = Math.max(0, debt - debtReduction);
      emergencyFund += emFundGrowth;
    }

    const projectedEmergencyMonths = request.monthlyExpenses > 0 ? emergencyFund / request.monthlyExpenses : 0;

    return {
      label: `${months} Month${months > 1 ? 's' : ''}`,
      months,
      netWorth: Math.round(netWorth + savings - debt),
      savings: Math.round(savings),
      debt: Math.round(debt),
      cashFlow: Math.round(monthlyCashFlow),
      emergencyFundMonths: Math.round(projectedEmergencyMonths * 10) / 10,
    };
  });

  return { projections: periods };
}
