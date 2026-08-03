import { FinancialEngine } from '@/services/FinancialEngine';
import type { ScenarioAdjustment } from '@budgetos/shared';
import type {
  CoachScenarioResult,
  CoachSnapshotData,
  ParsedScenario,
} from './types';

// ============================================================================
// What-if scenario engine (Phase 10)
//
// READ-ONLY. Scenarios apply hypothetical changes entirely in memory and run
// them through the Financial Engine. Actual financial records are NEVER
// mutated. The AI only explains the baseline-vs-scenario difference that the
// engine produces.
// ============================================================================

const EXTRA_MORTGAGE = /(?:extra|more|increase(?:d)?)\s*(?:of\s*)?\$?\s?(\d+)/i;
const EXTRA_SAVINGS = /(?:save|contribute|savings?)\s*(?:an extra\s*)?\$?\s?(\d+)\s*(?:more)?/i;
const EXTRA_SAVINGS_AFTER = /increase.*(?:contribution|saving).*\$?\s?(\d+)/i;
const REDUCE_SPENDING = /reduce(?: my)? (?:spending|expenses|dining|dining out|food|eating out) by \$?\s?(\d+)/i;
const INCOME_INCREASE = /(?:income|pay|salary|paycheck).*(?:increase|goes up|raise).*\$?\s?(\d+)/i;
const INCOME_AFTER = /make \$?\s?(\d+) more/i;

function toNumber(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function monthsBetween(startDate: string, date: string): number {
  const a = new Date(`${startDate}T00:00:00`);
  const b = new Date(`${date}T00:00:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
}

/**
 * Extracts a hypothetical change from a natural-language question.
 * Returns null when no scenario can be parsed (caller falls back to a normal
 * question flow). Never touches user data.
 */
export function parseScenario(message: string): ParsedScenario | null {
  const text = message.trim();

  if (/mortgage|pay off|payoff/i.test(text)) {
    const m = text.match(EXTRA_MORTGAGE);
    if (m) return { type: 'mortgage', extraAmount: toNumber(Number(m[1])) };
  }

  if (/save|savings? goal|contribution|contribute/i.test(text)) {
    const m = text.match(EXTRA_SAVINGS) ?? text.match(EXTRA_SAVINGS_AFTER);
    if (m) return { type: 'savings', extraAmount: toNumber(Number(m[1])) };
  }

  if (/reduce|cut (?:back )?(?:on )?/i.test(text)) {
    const m = text.match(REDUCE_SPENDING);
    if (m) {
      return {
        type: 'expense',
        reduceAmount: toNumber(Number(m[1])),
        target: /dining|eating out|food/i.test(text) ? 'dining/food' : undefined,
      };
    }
  }

  if (/income|pay|salary|paycheck|make/i.test(text)) {
    const m = text.match(INCOME_INCREASE) ?? text.match(INCOME_AFTER);
    if (m) return { type: 'income', increaseAmount: toNumber(Number(m[1])) };
  }

  return null;
}

function runMortgageScenario(snapshot: CoachSnapshotData, extraAmount: number): CoachScenarioResult['mortgage'] {
  const mortgage = snapshot.rawMortgages[0];
  if (!mortgage) return undefined;
  const monthsElapsed = monthsBetween(mortgage.startDate, snapshot.asOfDate);

  const baseExtras = (mortgage.extraPayments ?? [])
    .filter((e) => e.amount > 0)
    .map((e) => ({
      amount: e.amount,
      type: e.type ?? 'monthly',
      startMonth: monthsBetween(mortgage.startDate, e.date),
      endMonth: undefined,
    }));
  const scenarioExtras = [
    ...baseExtras,
    { amount: extraAmount, type: 'monthly' as const, startMonth: monthsElapsed, endMonth: undefined },
  ];

  const baseline = FinancialEngine.getMortgageForecast(
    mortgage.id,
    mortgage.name,
    mortgage.principal,
    mortgage.annualRate,
    mortgage.termYears,
    mortgage.startDate,
    baseExtras,
    monthsElapsed,
    mortgage.amortizationYears ?? undefined,
  );
  const scenario = FinancialEngine.getMortgageForecast(
    mortgage.id,
    mortgage.name,
    mortgage.principal,
    mortgage.annualRate,
    mortgage.termYears,
    mortgage.startDate,
    scenarioExtras,
    monthsElapsed,
    mortgage.amortizationYears ?? undefined,
  );
  if (!baseline || !scenario) return undefined;

  const monthsSaved = Math.max(0, baseline.payoffMonths - scenario.payoffMonths);
  return {
    baseline: {
      payoffDate: baseline.payoffDate,
      payoffMonths: baseline.payoffMonths,
      interestSaved: baseline.interestSaved,
      totalInterest: baseline.baselineInterest,
    },
    scenario: {
      payoffDate: scenario.payoffDate,
      payoffMonths: scenario.payoffMonths,
      interestSaved: scenario.interestSaved,
      totalInterest: scenario.baselineInterest,
    },
    monthsSaved,
    interestSavedDelta: Math.max(0, scenario.interestSaved - baseline.interestSaved),
  };
}

function runSavingsScenario(snapshot: CoachSnapshotData, extraAmount: number): CoachScenarioResult['savings'] {
  const goals = snapshot.rawSavings;
  const activeGoal = goals[0];
  if (!activeGoal) return undefined;

  const input = (offset: number) =>
    goals.map((g) => ({
      id: g.id,
      name: g.name,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      monthlyContribution: g.monthlyContribution + (g.id === activeGoal.id ? offset : 0),
      targetDate: g.targetDate,
    }));

  const baseline = FinancialEngine.getSavingsForecast(input(0), 0.07);
  const scenario = FinancialEngine.getSavingsForecast(input(extraAmount), 0.07);

  const baseGoal = baseline.goals.find((g) => g.goalId === activeGoal.id);
  const scenGoal = scenario.goals.find((g) => g.goalId === activeGoal.id);
  if (!baseGoal || !scenGoal) return undefined;

  const baseDate = baseGoal.projectedCompletionDate ? new Date(`${baseGoal.projectedCompletionDate}T00:00:00`).getTime() : null;
  const scenDate = scenGoal.projectedCompletionDate ? new Date(`${scenGoal.projectedCompletionDate}T00:00:00`).getTime() : null;
  const monthsSaved =
    baseDate && scenDate ? Math.round((baseDate - scenDate) / (1000 * 60 * 60 * 24 * 30.4375)) : null;

  return {
    baseline: {
      projectedBalance: baseGoal.projectedBalance,
      projectedCompletionDate: baseGoal.projectedCompletionDate,
      onTrack: baseGoal.onTrack,
    },
    scenario: {
      projectedBalance: scenGoal.projectedBalance,
      projectedCompletionDate: scenGoal.projectedCompletionDate,
      onTrack: scenGoal.onTrack,
    },
    monthsSaved: monthsSaved !== null && monthsSaved > 0 ? monthsSaved : null,
  };
}

function runComparisonScenario(
  snapshot: CoachSnapshotData,
  parsed: ParsedScenario,
): CoachScenarioResult {
  const d = snapshot.dashboard;
  const monthlyIncome = d.cashFlow.monthlyIncome;
  const monthlyExpenses = d.cashFlow.monthlyExpenses;
  const mortgagePaymentMonthly = d.mortgages.reduce((sum, m) => sum + m.monthlyPayment, 0);

  let adjustment: ScenarioAdjustment = { label: '' };
  let label = '';
  if (parsed.type === 'income') {
    const inc = Math.max(1, monthlyIncome + parsed.increaseAmount);
    adjustment = { label: '', incomeMultiplier: inc / Math.max(1, monthlyIncome) };
    label = `Income +$${parsed.increaseAmount}/mo`;
  } else if (parsed.type === 'expense') {
    const exp = Math.max(1, monthlyExpenses - parsed.reduceAmount);
    adjustment = { label: '', expenseMultiplier: exp / Math.max(1, monthlyExpenses) };
    label = `Expenses -$${parsed.reduceAmount}/mo`;
  } else if (parsed.type === 'savings') {
    const monthlySavings = d.savingsRate > 0 ? (monthlyIncome * d.savingsRate) / 100 : 0;
    const newSavings = Math.max(0, monthlySavings + parsed.extraAmount);
    adjustment = { label: '', savingsRateOverride: newSavings / Math.max(1, monthlyIncome) };
    label = `Savings +$${parsed.extraAmount}/mo`;
  } else {
    adjustment = { label: '', extraMortgagePayment: parsed.extraAmount };
    label = `Extra mortgage +$${parsed.extraAmount}/mo`;
  }

  const comparison = FinancialEngine.runScenario(
    d.netWorth.netWorth,
    d.savingsSnapshot.totalSaved,
    d.netWorth.totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    d.savingsRate / 100,
    d.availableCash,
    0,
    mortgagePaymentMonthly,
    0.07,
    adjustment,
  );

  return { parsed, label, comparison };
}

/**
 * Runs a parsed scenario against the authoritative snapshot and returns the
 * baseline-vs-scenario comparison. Read-only: nothing is written to the DB.
 */
export function runCoachScenario(
  snapshot: CoachSnapshotData,
  parsed: ParsedScenario,
): CoachScenarioResult | null {
  try {
    if (parsed.type === 'mortgage') {
      const mortgage = runMortgageScenario(snapshot, parsed.extraAmount);
      if (mortgage) {
        return {
          parsed,
          label: `Extra $${parsed.extraAmount}/mo toward mortgage`,
          mortgage,
        };
      }
      return runComparisonScenario(snapshot, parsed);
    }
    if (parsed.type === 'savings') {
      const savings = runSavingsScenario(snapshot, parsed.extraAmount);
      if (savings) {
        return {
          parsed,
          label: `Save an extra $${parsed.extraAmount}/mo`,
          savings,
        };
      }
      return runComparisonScenario(snapshot, parsed);
    }
    return runComparisonScenario(snapshot, parsed);
  } catch {
    return null;
  }
}
