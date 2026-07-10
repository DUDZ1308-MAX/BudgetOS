import { describe, it, expect } from 'vitest';
import { compareInvestVsPay } from '../invest-vs-pay';

describe('compareInvestVsPay', () => {
  it('returns a result with recommendation', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      },
      7.0,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recommendation).toBeTruthy();
    expect(result.data.totalInterestSaved).toBeGreaterThan(0);
  });

  it('returns failure for invalid mortgage input', () => {
    const result = compareInvestVsPay(
      {
        principal: -100,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [],
      },
      7.0,
    );

    expect(result.success).toBe(false);
  });

  it('computes positive investment value', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      },
      7.0,
    );

    if (!result.success) return;
    expect(result.data.investmentValueAtPayoff).toBeGreaterThan(0);
    expect(result.data.mortgagePayoffMonths).toBeGreaterThan(0);
  });
});
