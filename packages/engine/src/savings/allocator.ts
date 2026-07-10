import { FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { AllocationRequest, AllocationStep, AllocationResult } from './types';
import type { EngineResult } from '../shared/errors';
import { success, failure } from '../shared/errors';

interface PriorityRule {
  name: string;
  isComplete: (state: AllocationRequest['currentState']) => boolean;
  needed: (state: AllocationRequest['currentState']) => number;
  progress: (state: AllocationRequest['currentState']) => number;
  target: (state: AllocationRequest['currentState']) => number;
}

const DEFAULT_PRIORITIES: PriorityRule[] = [
  {
    name: 'High-Interest Debt',
    isComplete: (s) => s.highInterestDebtBalance <= 0,
    needed: (s) => s.highInterestDebtBalance,
    progress: (s) => 0,
    target: (s) => s.highInterestDebtBalance,
  },
  {
    name: 'Emergency Fund (Tier 1)',
    isComplete: (s) => s.emergencyFundBalance >= s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_1,
    needed: (s) => Math.max(0, s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_1 - s.emergencyFundBalance),
    progress: (s) => Math.min(s.emergencyFundBalance, s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_1),
    target: (s) => s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_1,
  },
  {
    name: 'Employer 401k Match',
    isComplete: () => false,
    needed: (s) => Math.round(s.salary * s.employerMatchPercent),
    progress: () => 0,
    target: (s) => Math.round(s.salary * s.employerMatchPercent),
  },
  {
    name: 'Emergency Fund (Tier 2)',
    isComplete: (s) => s.emergencyFundBalance >= s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2,
    needed: (s) => Math.max(0, s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2 - s.emergencyFundBalance),
    progress: (s) => Math.min(s.emergencyFundBalance, s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2),
    target: (s) => s.monthlyExpenses * FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2,
  },
  {
    name: 'IRA / Roth IRA',
    isComplete: () => false,
    needed: () => Math.max(0, FINANCIAL_THRESHOLDS.IRA_ANNUAL_LIMIT),
    progress: (s) => s.iraContributionsYTD,
    target: () => FINANCIAL_THRESHOLDS.IRA_ANNUAL_LIMIT,
  },
  {
    name: 'Extra Mortgage Principal',
    isComplete: (s) => !s.extraMortgageEnabled,
    needed: (s) => s.mortgageExtraDesired,
    progress: () => 0,
    target: (s) => s.mortgageExtraDesired,
  },
  {
    name: 'Taxable Brokerage / General Savings',
    isComplete: () => false,
    needed: () => Infinity,
    progress: () => 0,
    target: () => Infinity,
  },
];

export function computeAllocation(request: AllocationRequest): EngineResult<AllocationResult> {
  if (request.monthlySurplus < 0) {
    return failure({
      code: 'NEGATIVE_BALANCE',
      message: 'Cannot allocate a negative surplus. Reduce expenses or increase income first.',
      recoverable: true,
    });
  }

  const priorities = buildPriorityList(request);
  let remaining = request.monthlySurplus;
  const steps: AllocationStep[] = [];
  let cumulativeAllocated = 0;

  for (const rule of priorities) {
    if (remaining <= 0) break;

    const needed = rule.needed(request.currentState);
    const currentProgress = rule.progress(request.currentState);
    const isComplete = rule.isComplete(request.currentState);
    const allocation = isComplete ? 0 : Math.min(remaining, needed);

    if (allocation > 0) {
      remaining -= allocation;
      cumulativeAllocated += allocation;
    }

    steps.push({
      priority: steps.length + 1,
      bucketName: rule.name,
      targetAmount: rule.target(request.currentState),
      currentProgress,
      recommendedAllocation: allocation,
      cumulativeAllocated,
      isComplete: isComplete || (allocation >= needed && needed !== Infinity),
      estimatedCompletionDate: null,
    });
  }

  const summary = buildSummary(steps, request.monthlySurplus);

  return success({
    totalSurplus: request.monthlySurplus,
    remainingSurplus: remaining,
    steps,
    isFullyAllocated: remaining <= 0,
    summary,
  });
}

function buildPriorityList(request: AllocationRequest): PriorityRule[] {
  if (!request.customPriorities || request.customPriorities.length === 0) {
    return DEFAULT_PRIORITIES;
  }

  const priorityMap = new Map(request.customPriorities.map((p) => [p.bucketName, p]));
  return DEFAULT_PRIORITIES.map((rule) => {
    const custom = priorityMap.get(rule.name);
    if (custom) {
      return {
        ...rule,
        isComplete: () => custom.order < 0,
      };
    }
    return rule;
  }).filter((rule) => !rule.isComplete(request.currentState));
}

function buildSummary(steps: AllocationStep[], totalSurplus: number): string {
  if (totalSurplus === 0) {
    return 'No surplus available this month.';
  }

  const allocatedSteps = steps.filter((s) => s.recommendedAllocation > 0);
  if (allocatedSteps.length === 0) {
    return 'All financial priorities are complete. Consider increasing savings goals.';
  }

  const parts = allocatedSteps.map(
    (s) => `$${(s.recommendedAllocation / 100).toFixed(0)} to ${s.bucketName}`,
  );
  return `Allocate your $${(totalSurplus / 100).toFixed(0)} surplus: ${parts.join(', ')}.`;
}
