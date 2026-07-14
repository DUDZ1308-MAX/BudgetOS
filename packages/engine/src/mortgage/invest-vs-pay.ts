import { computeFutureValue } from '../shared/math';
import { toMonthlyEquivalent } from '../shared/frequency';
import { calculateFullAmortization } from './calculator';
import type { MortgageInput } from './types';
import type { InvestVsPayResult } from '@budgetos/shared';
import type { EngineResult } from '../shared/errors';
import { success, failure } from '../shared/errors';

export function compareInvestVsPay(
  mortgageInput: MortgageInput,
  assumedROI: number,
): EngineResult<InvestVsPayResult> {
  const result = calculateFullAmortization(mortgageInput);
  if (!result.success) {
    return failure(result.error);
  }

  const extraMonthly = mortgageInput.extraPayments.reduce((sum, ep) => {
    if (ep.type === 'monthly_fixed') {
      return sum + ep.amount;
    }
    if (ep.type === 'biweekly') {
      return sum + toMonthlyEquivalent(ep.amount, 'biweekly');
    }
    return sum;
  }, 0);

  const payoffMonths = result.data.schedule.length;
  const totalInterestSaved = result.data.interestSaved;

  const monthlyROI = assumedROI / 100 / 12;
  const investmentValue = computeFutureValue(extraMonthly, monthlyROI, payoffMonths);

  const remainingBalanceAtPayoff = 0;
  const netWorthDelta = investmentValue - remainingBalanceAtPayoff;

  let recommendation: string;
  if (netWorthDelta > totalInterestSaved) {
    recommendation = 'Investing the extra payment may yield higher net worth over the mortgage term.';
  } else if (totalInterestSaved > netWorthDelta) {
    recommendation = 'Paying down the mortgage saves more in guaranteed interest than investing at the assumed ROI.';
  } else {
    recommendation = 'The difference between investing and paying extra is minimal. Either approach is reasonable.';
  }

  return success({
    extraPaymentAmount: extraMonthly,
    assumedROI,
    mortgagePayoffMonths: payoffMonths,
    totalInterestSaved,
    investmentValueAtPayoff: investmentValue,
    netWorthDelta,
    recommendation,
  });
}
