import { describe, it, expect } from 'vitest';
import { calculateRetirementPlan } from '../planner';

const BASE = {
  currentYear: 2026,
  monthlyContribution: 500,
  annualReturnRate: 0.07,
  inflationRate: 0.03,
};

describe('calculateRetirementPlan', () => {
  it('calculates years until retirement for 30 -> 65', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 30, retirementAge: 65 });
    expect(plan.yearsUntilRetirement).toBe(35);
    expect(plan.estimatedRetirementYear).toBe(2061);
    expect(plan.isAtRetirementAge).toBe(false);
    expect(plan.passedRetirementAge).toBe(false);
  });

  it('calculates years until retirement for 50 -> 65', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 50, retirementAge: 65 });
    expect(plan.yearsUntilRetirement).toBe(15);
    expect(plan.estimatedRetirementYear).toBe(2041);
  });

  it('calculates a single year for 64 -> 65', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 64, retirementAge: 65 });
    expect(plan.yearsUntilRetirement).toBe(1);
    expect(plan.estimatedRetirementYear).toBe(2027);
  });

  it('marks equal ages as at retirement age (65 -> 65)', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 65, retirementAge: 65 });
    expect(plan.yearsUntilRetirement).toBe(0);
    expect(plan.estimatedRetirementYear).toBe(2026);
    expect(plan.isAtRetirementAge).toBe(true);
    expect(plan.passedRetirementAge).toBe(false);
    expect(plan.projectedNestEgg).toBe(0);
    expect(plan.readinessScore).toBe(0);
  });

  it('marks ages past retirement as passed (70 -> 65)', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 70, retirementAge: 65 });
    expect(plan.yearsUntilRetirement).toBe(-5);
    expect(plan.estimatedRetirementYear).toBe(2021);
    expect(plan.isAtRetirementAge).toBe(true);
    expect(plan.passedRetirementAge).toBe(true);
  });

  it('accumulates contributions at face value with no real growth', () => {
    const plan = calculateRetirementPlan({
      ...BASE,
      currentAge: 30,
      retirementAge: 65,
      annualReturnRate: 0,
      inflationRate: 0,
    });
    expect(plan.projectedNestEgg).toBe(500 * 12 * 35);
    expect(plan.monthlyIncome).toBe(Math.round(500 * 12 * 35 * 0.04 / 12));
    expect(plan.incomeTarget).toBe(500 * 12 * 10);
    expect(plan.readinessScore).toBeGreaterThan(0);
  });

  it('projects a nest egg larger than total contributions when real return is positive', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 30, retirementAge: 65 });
    expect(plan.projectedNestEgg).toBeGreaterThan(500 * 12 * 35);
    expect(plan.readinessScore).toBeLessThanOrEqual(100);
    expect(plan.readinessScore).toBeGreaterThanOrEqual(0);
  });

  it('returns a zero score when there are no contributions', () => {
    const plan = calculateRetirementPlan({ ...BASE, currentAge: 30, retirementAge: 65, monthlyContribution: 0 });
    expect(plan.projectedNestEgg).toBe(0);
    expect(plan.monthlyIncome).toBe(0);
    expect(plan.readinessScore).toBe(0);
  });

  it('never returns NaN for realistic inputs', () => {
    const plan = calculateRetirementPlan({
      ...BASE,
      currentAge: 30,
      retirementAge: 65,
      monthlyContribution: 500,
      annualReturnRate: 0.2,
      inflationRate: 0.1,
    });
    expect(plan.projectedNestEgg).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(plan.projectedNestEgg)).toBe(true);
    expect(Number.isFinite(plan.monthlyIncome)).toBe(true);
    expect(Number.isFinite(plan.readinessScore)).toBe(true);
  });
});
