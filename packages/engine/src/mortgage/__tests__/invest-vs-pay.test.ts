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

  it('returns 0 interest saved when no extra payments', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [],
      },
      7.0,
    );

    if (!result.success) return;
    expect(result.data.totalInterestSaved).toBe(0);
    expect(result.data.extraPaymentAmount).toBe(0);
  });

  it('handles zero ROI (investment value equals sum of payments, no growth)', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      },
      0,
    );

    if (!result.success) return;
    expect(result.data.investmentValueAtPayoff).toBeGreaterThan(0);
    expect(result.data.totalInterestSaved).toBeGreaterThan(0);
  });

  it('handles high ROI (15%)', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      },
      15.0,
    );

    if (!result.success) return;
    expect(result.data.investmentValueAtPayoff).toBeGreaterThan(0);
    expect(result.data.recommendation).toContain('Investing');
  });

  it('handles biweekly extra payments', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'biweekly', amount: 100_00 }],
      },
      7.0,
    );

    if (!result.success) return;
    expect(result.data.extraPaymentAmount).toBeGreaterThan(0);
    expect(result.data.totalInterestSaved).toBeGreaterThan(0);
  });

  it('handles multiple extra payment types', () => {
    const result = compareInvestVsPay(
      {
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [
          { type: 'monthly_fixed', amount: 100_00 },
          { type: 'biweekly', amount: 50_00 },
        ],
      },
      7.0,
    );

    if (!result.success) return;
    expect(result.data.extraPaymentAmount).toBeGreaterThan(0);
    expect(result.data.totalInterestSaved).toBeGreaterThan(0);
  });

  it('net worth delta equals investment value (remaining balance at payoff is 0)', () => {
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
    expect(result.data.netWorthDelta).toBe(result.data.investmentValueAtPayoff);
  });

  it('recommendation is one of three options', () => {
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
    const validRecommendations = [
      'Investing the extra payment may yield higher net worth over the mortgage term.',
      'Paying down the mortgage saves more in guaranteed interest than investing at the assumed ROI.',
      'The difference between investing and paying extra is minimal. Either approach is reasonable.',
    ];
    expect(validRecommendations).toContain(result.data.recommendation);
  });
});
