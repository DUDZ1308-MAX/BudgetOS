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
});
