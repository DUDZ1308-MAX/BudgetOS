import { describe, it, expect } from 'vitest';
import { computeAllocation } from '../allocator';

describe('computeAllocation', () => {
  it('allocates to high-interest debt first', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 5000_00,
        emergencyFundBalance: 0,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 12,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.steps[0]?.bucketName).toBe('High-Interest Debt');
    expect(result.data.steps[0]?.recommendedAllocation).toBeGreaterThan(0);
  });

  it('returns failure for negative surplus', () => {
    const result = computeAllocation({
      monthlySurplus: -100_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 5000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(false);
  });

  it('allocates to emergency fund when no high-interest debt', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 2000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    const hasEmergencyStep = result.data.steps.some((s) => s.bucketName.includes('Emergency'));
    expect(hasEmergencyStep).toBe(true);
  });

  it('marks fully allocated when surplus is distributed', () => {
    const result = computeAllocation({
      monthlySurplus: 100_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50_000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 7000_00,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.remainingSurplus).toBe(0);
    expect(result.data.isFullyAllocated).toBe(true);
  });

  it('returns empty summary for zero surplus', () => {
    const result = computeAllocation({
      monthlySurplus: 0,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 0,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.summary).toBe('No surplus available this month.');
  });

  it('allocates to employer 401k match after emergency fund', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 30000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    const has401kStep = result.data.steps.some((s) => s.bucketName.includes('401k'));
    expect(has401kStep).toBe(true);
  });

  it('includes IRA step in allocation waterfall', () => {
    const result = computeAllocation({
      monthlySurplus: 50000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    const hasIRAStep = result.data.steps.some((s) => s.bucketName.includes('IRA'));
    expect(hasIRAStep).toBe(true);
  });

  it('includes mortgage step when extraMortgageEnabled', () => {
    const result = computeAllocation({
      monthlySurplus: 50000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 7000_00,
        extraMortgageEnabled: true,
        mortgageExtraDesired: 500_00,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    const hasMortgageStep = result.data.steps.some((s) => s.bucketName.includes('Mortgage'));
    expect(hasMortgageStep).toBe(true);
  });

  it('includes brokerage step in allocation waterfall', () => {
    const result = computeAllocation({
      monthlySurplus: 50000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 7000_00,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    const hasBrokerageStep = result.data.steps.some((s) => s.bucketName.includes('Brokerage'));
    expect(hasBrokerageStep).toBe(true);
  });

  it('fills buckets in priority order', () => {
    const result = computeAllocation({
      monthlySurplus: 5000_00,
      currentState: {
        highInterestDebtBalance: 2000_00,
        emergencyFundBalance: 1000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 12,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const steps = result.data.steps;
    expect(steps.length).toBeGreaterThan(0);

    let prevPriority = 0;
    for (const step of steps) {
      expect(step.priority).toBeGreaterThanOrEqual(prevPriority);
      prevPriority = step.priority;
    }
  });

  it('marks bucket as complete when allocation meets needed', () => {
    const result = computeAllocation({
      monthlySurplus: 10000_00,
      currentState: {
        highInterestDebtBalance: 2000_00,
        emergencyFundBalance: 0,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 12,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const debtStep = result.data.steps.find((s) => s.bucketName.includes('Debt'));
    expect(debtStep?.isComplete).toBe(true);
  });

  it('returns summary with allocation details', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 5000_00,
        emergencyFundBalance: 0,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 12,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.summary).toContain('Allocate');
    expect(result.data.summary).toContain('surplus');
  });

  it('returns fully allocated message when all surplus distributed', () => {
    const result = computeAllocation({
      monthlySurplus: 100_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50_000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 7000_00,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.isFullyAllocated).toBe(true);
  });

  it('handles custom priorities', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 50000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0.06,
        salary: 80_000_00,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
      customPriorities: [
        { bucketName: 'High-Interest Debt', order: -1, splitPercent: 0 },
        { bucketName: 'Emergency Fund (Tier 1)', order: -1, splitPercent: 0 },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const hasHighInterestDebt = result.data.steps.some((s) => s.bucketName.includes('Debt'));
    expect(hasHighInterestDebt).toBe(false);
  });

  it('handles fully funded emergency fund', () => {
    const result = computeAllocation({
      monthlySurplus: 1000_00,
      currentState: {
        highInterestDebtBalance: 0,
        emergencyFundBalance: 100000_00,
        monthlyExpenses: 3000_00,
        employerMatchPercent: 0,
        salary: 0,
        iraContributionsYTD: 0,
        extraMortgageEnabled: false,
        mortgageExtraDesired: 0,
        highInterestDebtApr: 0,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const emergencyStep = result.data.steps.find((s) => s.bucketName.includes('Emergency'));
    expect(emergencyStep?.isComplete).toBe(true);
  });
});
