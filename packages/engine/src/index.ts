export const ENGINE_VERSION = '1.0.0';

export * from './shared/math';
export * from './shared/precision';
export * from './shared/date';
export * from './shared/errors';
export * from './shared/frequency';

export { calculateFullAmortization } from './mortgage/calculator';
export { compareScenarios } from './mortgage/scenarios';
export { compareInvestVsPay } from './mortgage/invest-vs-pay';

export { computeBudgetSummary } from './budget/calculator';
export { computeCategoryStatus, computeWeightedAdherence } from './budget/percentage';

export { calculateSurplus } from './savings/surplus';
export { computeGoalProgress } from './savings/goals';
export { computeAllocation } from './savings/allocator';

export { computeScore as computeHealthScore } from './health-score/calculator';
export { getTopRecommendation } from './health-score/recommendations';

export { evaluateCoachRules } from './coach/engine';
