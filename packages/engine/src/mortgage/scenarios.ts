import { calculateFullAmortization } from './calculator';
import type { ScenarioInput, ScenarioComparison, ScenarioResult } from './types';
import type { EngineResult } from '../shared/errors';
import { success, failure } from '../shared/errors';

export function compareScenarios(inputs: ScenarioInput[]): EngineResult<ScenarioComparison> {
  if (inputs.length === 0) {
    return failure({
      code: 'INVALID_INPUT',
      message: 'At least one scenario is required',
      recoverable: true,
    });
  }

  const scenarioResults: ScenarioResult[] = [];

  for (const input of inputs) {
    const result = calculateFullAmortization({
      principal: input.principal,
      annualRate: input.annualRate,
      termYears: input.termYears,
      startDate: input.startDate,
      extraPayments: input.extraPayments,
    });

    if (!result.success) {
      return failure(result.error);
    }

    scenarioResults.push({
      label: input.label,
      monthlyPayment: result.data.monthlyPayment,
      totalPayments: result.data.totalPayments,
      totalPrincipal: result.data.totalPrincipal,
      totalInterest: result.data.totalInterest,
      payoffDate: result.data.payoffDate,
      interestSaved: result.data.interestSaved,
      amortizationSchedule: result.data.schedule,
    });
  }

  const sortedByPayoff = [...scenarioResults].sort(
    (a, b) => new Date(a.payoffDate).getTime() - new Date(b.payoffDate).getTime(),
  );

  return success({
    scenarios: scenarioResults,
    bestPayoffDate: sortedByPayoff[0]?.payoffDate ?? '',
    bestInterestSaved: Math.max(...scenarioResults.map((s) => s.interestSaved)),
  });
}
