import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  calculateInterestSaved,
  calculatePayoffDate,
  calculateRemainingBalance,
  calculateInvestVsMortgage,
  computeMortgageDashboard,
  computeMortgage,
  computeEffectiveAnnualRate,
  compareScenarios,
  calculateExtraPaymentScenario,
} from '../mortgage';
import type { MortgageInput, PaymentFrequency, ScenarioInput } from '../mortgage';

const STANDARD_INPUT: MortgageInput = {
  principal: 500_000_00, // $500,000 in cents
  annualRate: 5.5,
  amortizationYears: 25,
  startDate: '2024-01-01',
  paymentFrequency: 'monthly',
  isCompoundSemiAnnual: true,
};

const US_STYLE_INPUT: MortgageInput = {
  ...STANDARD_INPUT,
  isCompoundSemiAnnual: false,
};

describe('computeMortgage', () => {
  it('returns null for invalid input', () => {
    expect(computeMortgage({ ...STANDARD_INPUT, principal: 0 })).toBeNull();
    expect(computeMortgage({ ...STANDARD_INPUT, principal: -1000 })).toBeNull();
    expect(computeMortgage({ ...STANDARD_INPUT, annualRate: -1 })).toBeNull();
    expect(computeMortgage({ ...STANDARD_INPUT, annualRate: 101 })).toBeNull();
    expect(computeMortgage({ ...STANDARD_INPUT, amortizationYears: 0 })).toBeNull();
    expect(computeMortgage({ ...STANDARD_INPUT, amortizationYears: 51 })).toBeNull();
  });

  it('returns valid result for standard Canadian mortgage', () => {
    const result = computeMortgage(STANDARD_INPUT);
    expect(result).not.toBeNull();
    expect(result!.paymentAmount).toBeGreaterThan(0);
    expect(result!.totalInterest).toBeGreaterThan(0);
    expect(result!.schedule.length).toBeGreaterThan(0);
    expect(result!.schedule.length).toBeLessThanOrEqual(300); // 25 years * 12
    expect(result!.paymentFrequency).toBe('monthly');
    expect(result!.paymentsPerYear).toBe(12);
  });

  it('Canadian semi-annual compounding produces different payment than monthly', () => {
    const canadian = computeMortgage(STANDARD_INPUT);
    const usStyle = computeMortgage(US_STYLE_INPUT);

    expect(canadian).not.toBeNull();
    expect(usStyle).not.toBeNull();

    // Canadian semi-annual compounding results in slightly higher effective rate
    // so payments should be different
    expect(canadian!.paymentAmount).not.toBe(usStyle!.paymentAmount);
  });

  it('effective annual rate is correct for Canadian semi-annual', () => {
    const result = computeMortgage(STANDARD_INPUT);
    expect(result).not.toBeNull();

    // For 5.5% nominal compounded semi-annually:
    // EAR = (1 + 0.055/2)^2 - 1 = (1.0275)^2 - 1 ≈ 0.055756
    expect(result!.effectiveAnnualRate).toBeCloseTo(0.0558, 3);
  });

  it('handles 0% interest rate', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      annualRate: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.totalInterest).toBe(0);
    expect(result!.paymentAmount).toBeGreaterThan(0);
  });

  it('handles very short term (1 year)', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      amortizationYears: 1,
    });
    expect(result).not.toBeNull();
    expect(result!.schedule.length).toBeLessThanOrEqual(12);
  });

  it('handles very large principal ($1M)', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      principal: 1_000_000_00,
    });
    expect(result).not.toBeNull();
    expect(result!.paymentAmount).toBeGreaterThan(0);
  });

  it('payoff date is in the future', () => {
    const result = computeMortgage(STANDARD_INPUT);
    expect(result).not.toBeNull();
    const payoffDate = new Date(result!.payoffDate);
    expect(payoffDate.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
  });
});

describe('Payment Frequencies', () => {
  const frequencies: PaymentFrequency[] = [
    'monthly',
    'semi_monthly',
    'bi_weekly',
    'accelerated_bi_weekly',
    'weekly',
    'accelerated_weekly',
  ];

  frequencies.forEach((frequency) => {
    it(`handles ${frequency} frequency`, () => {
      const result = computeMortgage({
        ...STANDARD_INPUT,
        paymentFrequency: frequency,
      });
      expect(result).not.toBeNull();
      expect(result!.paymentFrequency).toBe(frequency);
      expect(result!.paymentAmount).toBeGreaterThan(0);
      expect(result!.schedule.length).toBeGreaterThan(0);
    });
  });

  it('accelerated bi-weekly pays off faster than monthly', () => {
    const monthly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'monthly' });
    const accelBiweekly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'accelerated_bi_weekly' });

    expect(monthly).not.toBeNull();
    expect(accelBiweekly).not.toBeNull();

    // Accelerated bi-weekly should pay off faster (fewer months)
    expect(accelBiweekly!.payoffMonths).toBeLessThan(monthly!.payoffMonths);
  });

  it('accelerated weekly pays off faster than monthly', () => {
    const monthly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'monthly' });
    const accelWeekly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'accelerated_weekly' });

    expect(monthly).not.toBeNull();
    expect(accelWeekly).not.toBeNull();

    // Accelerated weekly should pay off faster
    expect(accelWeekly!.payoffMonths).toBeLessThan(monthly!.payoffMonths);
  });

  it('monthly equivalent is consistent across frequencies', () => {
    const monthly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'monthly' });
    const biweekly = computeMortgage({ ...STANDARD_INPUT, paymentFrequency: 'bi_weekly' });

    expect(monthly).not.toBeNull();
    expect(biweekly).not.toBeNull();

    // Monthly equivalent should be similar (within 1% due to rounding)
    const diff = Math.abs(monthly!.monthlyEquivalent - biweekly!.monthlyEquivalent);
    const avg = (monthly!.monthlyEquivalent + biweekly!.monthlyEquivalent) / 2;
    expect(diff / avg).toBeLessThan(0.01);
  });
});

describe('Extra Payments', () => {
  it('monthly fixed extra payment reduces term', () => {
    const baseline = computeMortgage(STANDARD_INPUT);
    const withExtra = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.payoffMonths).toBeLessThan(baseline!.payoffMonths);
  });

  it('monthly fixed extra payment reduces total interest', () => {
    const baseline = computeMortgage(STANDARD_INPUT);
    const withExtra = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.totalInterest).toBeLessThan(baseline!.totalInterest);
  });

  it('annual lump sum reduces term', () => {
    const baseline = computeMortgage(STANDARD_INPUT);
    const withExtra = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'annual_lump', amount: 10_000_00 }],
    });

    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.payoffMonths).toBeLessThan(baseline!.payoffMonths);
  });

  it('one-time extra payment reduces term', () => {
    const baseline = computeMortgage(STANDARD_INPUT);
    const withExtra = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'one_time', amount: 20_000_00, startMonth: 12 }],
    });

    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.payoffMonths).toBeLessThanOrEqual(baseline!.payoffMonths);
  });

  it('interest saved is positive with extra payments', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    expect(result).not.toBeNull();
    expect(result!.interestSaved).toBeGreaterThan(0);
  });

  it('multiple extra payment types combine', () => {
    const baseline = computeMortgage(STANDARD_INPUT);
    const withExtra = computeMortgage({
      ...STANDARD_INPUT,
      extraPayments: [
        { type: 'monthly_fixed', amount: 100_00 },
        { type: 'annual_lump', amount: 5_000_00 },
        { type: 'one_time', amount: 10_000_00, startMonth: 24 },
      ],
    });

    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.payoffMonths).toBeLessThan(baseline!.payoffMonths);
    expect(withExtra!.totalInterest).toBeLessThan(baseline!.totalInterest);
  });
});

describe('Amortization Schedule', () => {
  it('generates correct number of payments', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    expect(schedule.length).toBeLessThanOrEqual(300);
  });

  it('final balance is zero', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow).toBeDefined();
    expect(lastRow!.remainingBalance).toBe(0);
  });

  it('total principal equals original principal', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(500_000_00, 0);
  });

  it('remaining balance decreases each payment', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );

    for (let i = 1; i < schedule.length; i++) {
      const prevBalance = schedule[i - 1]?.remainingBalance ?? 0;
      const currBalance = schedule[i]?.remainingBalance ?? 0;
      expect(currBalance).toBeLessThanOrEqual(prevBalance);
    }
  });

  it('cumulative interest increases each payment', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );

    for (let i = 1; i < schedule.length; i++) {
      const prevInterest = schedule[i - 1]?.cumulativeInterest ?? 0;
      const currInterest = schedule[i]?.cumulativeInterest ?? 0;
      expect(currInterest).toBeGreaterThanOrEqual(prevInterest);
    }
  });

  it('payment dates are sequential', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );

    for (let i = 1; i < schedule.length; i++) {
      const prevDate = new Date(schedule[i - 1]?.date ?? '');
      const currDate = new Date(schedule[i]?.date ?? '');
      expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
    }
  });
});

describe('calculateInterestSaved', () => {
  it('returns 0 when schedule matches original', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    expect(calculateInterestSaved(schedule, totalInterest)).toBe(0);
  });

  it('returns > 0 when extra payments made', () => {
    const base = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const accelerated = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [{ type: 'monthly_fixed', amount: 200_00 }],
      true,
    );
    const originalInterest = base.reduce((s, r) => s + r.interest, 0);
    const saved = calculateInterestSaved(accelerated, originalInterest);
    expect(saved).toBeGreaterThan(0);
  });
});

describe('calculatePayoffDate', () => {
  it('returns last schedule date', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const date = calculatePayoffDate(schedule);
    expect(date).toBeTruthy();
    expect(date).toContain('20');
  });

  it('returns null for empty schedule', () => {
    expect(calculatePayoffDate([])).toBeNull();
  });
});

describe('calculateRemainingBalance', () => {
  it('returns balance at given payment number', () => {
    const schedule = generateAmortizationSchedule(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      'monthly',
      [],
      true,
    );
    const balance = calculateRemainingBalance(schedule, 1);
    expect(balance).toBeGreaterThan(0);
    expect(balance).toBeLessThan(500_000_00);
  });
});

describe('calculateInvestVsMortgage', () => {
  it('returns comparison result', () => {
    const result = calculateInvestVsMortgage(
      500_000_00,
      5.5,
      25,
      7.0,
      200_00,
    );
    expect(result.mortgageSaved).toBeGreaterThanOrEqual(0);
    expect(result.investmentEarned).toBeGreaterThanOrEqual(0);
    expect(['mortgage', 'invest']).toContain(result.betterOption);
    expect(result.monthlyInvestmentBalance.length).toBeGreaterThan(0);
  });
});

describe('computeMortgageDashboard', () => {
  it('computes dashboard metrics', () => {
    const mortgage = computeMortgage(STANDARD_INPUT)!;
    const dashboard = computeMortgageDashboard(mortgage);

    expect(dashboard.totalCost).toBeGreaterThan(500_000_00);
    expect(dashboard.progressPct).toBeGreaterThanOrEqual(0);
    expect(dashboard.totalPaymentsMade).toBeGreaterThanOrEqual(0);
    expect(dashboard.equityBuilt).toBeGreaterThanOrEqual(0);
    expect(dashboard.principalPaidPct).toBeGreaterThanOrEqual(0);
  });

  it('remaining balance equals principal for newly created mortgage', () => {
    const today = new Date().toISOString().slice(0, 10);
    const mortgage = computeMortgage({ ...STANDARD_INPUT, startDate: today })!;
    const dashboard = computeMortgageDashboard(mortgage);

    // Mortgage just created today, no payments made yet → remaining balance = principal
    expect(dashboard.remainingBalance).toBeCloseTo(STANDARD_INPUT.principal, 0);
    expect(dashboard.progressPct).toBe(0);
    expect(dashboard.paidSoFar.principal).toBe(0);
    expect(dashboard.paidSoFar.interest).toBe(0);
  });

  it('remaining balance decreases after payments', () => {
    // Start 12 months ago so 12 payments have been made
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    const startStr = startDate.toISOString().slice(0, 10);

    const mortgage = computeMortgage({ ...STANDARD_INPUT, startDate: startStr })!;
    const dashboard = computeMortgageDashboard(mortgage);

    expect(dashboard.remainingBalance).toBeGreaterThan(0);
    expect(dashboard.remainingBalance).toBeLessThan(STANDARD_INPUT.principal);
    expect(dashboard.paidSoFar.principal).toBeGreaterThan(0);
    expect(dashboard.paidSoFar.interest).toBeGreaterThan(0);
    expect(dashboard.progressPct).toBeGreaterThan(0);
    expect(dashboard.totalPaymentsMade).toBeGreaterThanOrEqual(1);
  });

  it('remaining balance at payment 60 matches schedule row 60', () => {
    const mortgage = computeMortgage(STANDARD_INPUT)!;
    const scheduleRow60 = mortgage.schedule.find((r) => r.paymentNumber === 60);

    // Start 60 months ago
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);
    const startStr = startDate.toISOString().slice(0, 10);

    const mortgageWithHistory = computeMortgage({ ...STANDARD_INPUT, startDate: startStr })!;
    const dashboard = computeMortgageDashboard(mortgageWithHistory);

    expect(scheduleRow60).toBeDefined();
    expect(dashboard.remainingBalance).toBeCloseTo(scheduleRow60!.remainingBalance, 0);
  });

  it('equity built + remaining balance equals principal', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);
    const startStr = startDate.toISOString().slice(0, 10);

    const mortgage = computeMortgage({ ...STANDARD_INPUT, startDate: startStr })!;
    const dashboard = computeMortgageDashboard(mortgage);

    const sum = dashboard.equityBuilt + dashboard.remainingBalance;
    expect(sum).toBeCloseTo(STANDARD_INPUT.principal, 0);
  });

  it('remaining balance with extra payments is lower', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);
    const startStr = startDate.toISOString().slice(0, 10);

    const baseline = computeMortgageDashboard(
      computeMortgage({ ...STANDARD_INPUT, startDate: startStr })!,
    );
    const withExtra = computeMortgageDashboard(
      computeMortgage({
        ...STANDARD_INPUT,
        startDate: startStr,
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      })!,
    );

    expect(withExtra.remainingBalance).toBeLessThan(baseline.remainingBalance);
    expect(withExtra.equityBuilt).toBeGreaterThan(baseline.equityBuilt);
  });

  it('remaining balance at final payment is zero', () => {
    const startDate = new Date();
    // Start 300 months ago (25 years) to reach the end
    startDate.setMonth(startDate.getMonth() - 300);
    const startStr = startDate.toISOString().slice(0, 10);

    const mortgage = computeMortgage({ ...STANDARD_INPUT, startDate: startStr })!;
    const dashboard = computeMortgageDashboard(mortgage);

    // At the final payment, remaining balance should be 0 or very close
    expect(dashboard.remainingBalance).toBeLessThanOrEqual(1); // Allow rounding
  });
});

describe('computeEffectiveAnnualRate', () => {
  it('calculates Canadian semi-annual EAR correctly', () => {
    // 5.5% nominal compounded semi-annually
    const ear = computeEffectiveAnnualRate(5.5, true);
    // EAR = (1 + 0.055/2)^2 - 1 ≈ 0.055756
    expect(ear).toBeCloseTo(0.0558, 3);
  });

  it('calculates monthly compounding EAR correctly', () => {
    // 5.5% nominal compounded monthly
    const ear = computeEffectiveAnnualRate(5.5, false);
    // EAR = (1 + 0.055/12)^12 - 1 ≈ 0.056408
    expect(ear).toBeCloseTo(0.0564, 3);
  });

  it('returns 0 for 0% rate', () => {
    expect(computeEffectiveAnnualRate(0, true)).toBe(0);
    expect(computeEffectiveAnnualRate(0, false)).toBe(0);
  });
});

describe('compareScenarios', () => {
  it('compares multiple scenarios', () => {
    const scenarios: ScenarioInput[] = [
      {
        label: '25-year fixed',
        principal: 500_000_00,
        annualRate: 5.5,
        amortizationYears: 25,
        startDate: '2024-01-01',
        paymentFrequency: 'monthly',
      },
      {
        label: '30-year fixed',
        principal: 500_000_00,
        annualRate: 5.5,
        amortizationYears: 30,
        startDate: '2024-01-01',
        paymentFrequency: 'monthly',
      },
    ];

    const comparison = compareScenarios(scenarios);

    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.bestPayoffDate).toBeTruthy();
    expect(comparison.bestInterestSaved).toBeGreaterThanOrEqual(0);
  });

  it('returns empty for no valid scenarios', () => {
    const scenarios: ScenarioInput[] = [];
    const comparison = compareScenarios(scenarios);

    expect(comparison.scenarios.length).toBe(0);
    expect(comparison.bestPayoffDate).toBe('');
  });
});

describe('calculateExtraPaymentScenario', () => {
  it('returns null for invalid input', () => {
    const result = calculateExtraPaymentScenario(
      0,
      5.5,
      25,
      '2024-01-01',
      [{ type: 'monthly_fixed', amount: 200_00 }],
    );
    expect(result).toBeNull();
  });

  it('returns valid result with extra payments', () => {
    const result = calculateExtraPaymentScenario(
      500_000_00,
      5.5,
      25,
      '2024-01-01',
      [{ type: 'monthly_fixed', amount: 200_00 }],
    );
    expect(result).not.toBeNull();
    expect(result!.interestSaved).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('handles very small principal ($1000)', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      principal: 100_00, // $1,000
    });
    expect(result).not.toBeNull();
    expect(result!.paymentAmount).toBeGreaterThan(0);
  });

  it('handles very high interest rate (20%)', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      annualRate: 20,
    });
    expect(result).not.toBeNull();
    expect(result!.totalInterest).toBeGreaterThan(0);
  });

  it('handles 5-year amortization', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      amortizationYears: 5,
    });
    expect(result).not.toBeNull();
    expect(result!.schedule.length).toBeLessThanOrEqual(60);
  });

  it('handles 50-year amortization (maximum)', () => {
    const result = computeMortgage({
      ...STANDARD_INPUT,
      amortizationYears: 50,
    });
    expect(result).not.toBeNull();
    expect(result!.schedule.length).toBeLessThanOrEqual(600);
  });
});

describe('Regression: Remaining Balance Zero Bug', () => {
  const REGRESSION_INPUT: MortgageInput = {
    principal: 350_000_00, // $350,000
    annualRate: 5,
    amortizationYears: 25,
    startDate: '2024-01-01',
    paymentFrequency: 'monthly',
    isCompoundSemiAnnual: true,
  };

  it('new mortgage shows principal as remaining balance', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: today });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeCloseTo(350_000_00, -2);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
  });

  it('remaining balance after 1 payment is less than principal', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
    expect(dashboard.remainingBalance).toBeLessThan(350_000_00);
  });

  it('remaining balance after 12 payments is correct', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
    expect(dashboard.remainingBalance).toBeLessThan(350_000_00);
    expect(dashboard.paidSoFar.principal).toBeGreaterThan(0);
    expect(dashboard.paidSoFar.interest).toBeGreaterThan(0);
  });

  it('remaining balance after 60 payments (5 years) is correct', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
    expect(dashboard.remainingBalance).toBeLessThan(350_000_00);
    // After 5 years of a 25-year mortgage, should have paid roughly 15-20% of principal
    expect(dashboard.principalPaidPct).toBeGreaterThan(10);
    expect(dashboard.principalPaidPct).toBeLessThan(30);
  });

  it('empty extra payments array does not break calculation', () => {
    const result = computeMortgage({ ...REGRESSION_INPUT, extraPayments: [] });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
  });

  it('undefined extra payments does not break calculation', () => {
    const result = computeMortgage({
      principal: 350_000_00,
      annualRate: 5,
      amortizationYears: 25,
      startDate: '2024-01-01',
      paymentFrequency: 'monthly',
    });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeGreaterThan(0);
  });

  it('extra payment reduces remaining balance faster', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60);
    const startStr = startDate.toISOString().slice(0, 10);

    const baseline = computeMortgageDashboard(
      computeMortgage({ ...REGRESSION_INPUT, startDate: startStr })!,
    );
    const withExtra = computeMortgageDashboard(
      computeMortgage({
        ...REGRESSION_INPUT,
        startDate: startStr,
        extraPayments: [{ type: 'monthly_fixed', amount: 500_00 }],
      })!,
    );

    expect(withExtra.remainingBalance).toBeLessThan(baseline.remainingBalance);
    expect(withExtra.equityBuilt).toBeGreaterThan(baseline.equityBuilt);
  });

  it('final payment shows zero remaining balance', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 300); // 25 years
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeLessThanOrEqual(1);
  });

  it('equity built + remaining balance always equals principal', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 120); // 10 years
    const result = computeMortgage({ ...REGRESSION_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    const sum = dashboard.equityBuilt + dashboard.remainingBalance;
    expect(sum).toBeCloseTo(350_000_00, 0);
  });
});

describe('Mortgage Summary Invariants', () => {
  const INVARIANT_INPUT: MortgageInput = {
    principal: 350_000_00, // $350,000
    annualRate: 5,
    amortizationYears: 25,
    startDate: '2024-01-01',
    paymentFrequency: 'monthly',
    isCompoundSemiAnnual: true,
  };

  it('equityBuilt + remainingBalance = originalAmount at all payment positions', () => {
    const positions = [1, 6, 12, 24, 60, 120, 180, 240, 299];
    for (const monthsAgo of positions) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsAgo);
      const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
      if (!result) continue;
      const dashboard = computeMortgageDashboard(result);
      const sum = dashboard.equityBuilt + dashboard.remainingBalance;
      expect(sum).toBeCloseTo(INVARIANT_INPUT.principal, 0);
    }
  });

  it('progressPct = paidSoFar.principal / totalPrincipal * 100 at all positions', () => {
    const positions = [1, 12, 60, 120, 240];
    for (const monthsAgo of positions) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsAgo);
      const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
      if (!result) continue;
      const dashboard = computeMortgageDashboard(result);
      const expectedProgress = (dashboard.paidSoFar.principal / INVARIANT_INPUT.principal) * 100;
      expect(dashboard.progressPct).toBeCloseTo(Math.min(100, expectedProgress), 1);
    }
  });

  it('remainingBalance matches schedule row at current payment position', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 60); // 60 months ago
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    const scheduleRow = result!.schedule.find((r) => r.paymentNumber === dashboard.totalPaymentsMade);
    if (scheduleRow) {
      expect(dashboard.remainingBalance).toBeCloseTo(scheduleRow.remainingBalance, 0);
    }
  });

  it('paidSoFar.principal = sum of principal from schedule rows 1..currentPaymentNumber', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 24); // 24 months ago
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    const expectedPrincipal = result!.schedule
      .filter((r) => r.paymentNumber <= dashboard.totalPaymentsMade)
      .reduce((sum, r) => sum + r.principal, 0);
    expect(dashboard.paidSoFar.principal).toBeCloseTo(expectedPrincipal, 0);
  });

  it('paidSoFar.interest = sum of interest from schedule rows 1..currentPaymentNumber', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 24); // 24 months ago
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    const expectedInterest = result!.schedule
      .filter((r) => r.paymentNumber <= dashboard.totalPaymentsMade)
      .reduce((sum, r) => sum + r.interest, 0);
    expect(dashboard.paidSoFar.interest).toBeCloseTo(expectedInterest, 0);
  });

  it('new mortgage: remainingBalance = totalPrincipal, progressPct = 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: today });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeCloseTo(INVARIANT_INPUT.principal, -2);
    expect(dashboard.progressPct).toBe(0);
    expect(dashboard.paidSoFar.principal).toBe(0);
    expect(dashboard.paidSoFar.interest).toBe(0);
    expect(dashboard.equityBuilt).toBe(0);
  });

  it('fully paid: remainingBalance ≈ 0, progressPct ≈ 100', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 300); // 25 years
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.remainingBalance).toBeLessThanOrEqual(1);
    expect(dashboard.progressPct).toBeGreaterThanOrEqual(99.9);
    expect(dashboard.equityBuilt).toBeCloseTo(INVARIANT_INPUT.principal, -2);
  });

  it('originalAmount field matches totalPrincipal', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: today });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);
    expect(dashboard.originalAmount).toBe(INVARIANT_INPUT.principal);
  });

  it('summary card values match amortization schedule for $350K mortgage', () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 120); // 10 years
    const result = computeMortgage({ ...INVARIANT_INPUT, startDate: startDate.toISOString().slice(0, 10) });
    expect(result).not.toBeNull();
    const dashboard = computeMortgageDashboard(result!);

    // Verify every summary card derives from the same engine
    expect(dashboard.originalAmount).toBe(350_000_00);
    expect(dashboard.remainingBalance + dashboard.equityBuilt).toBeCloseTo(350_000_00, 0);
    expect(dashboard.progressPct).toBeCloseTo(
      (dashboard.paidSoFar.principal / 350_000_00) * 100,
      1,
    );
    expect(dashboard.paidSoFar.principal + dashboard.paidSoFar.interest).toBeGreaterThan(0);
    expect(dashboard.totalPaymentsMade).toBeGreaterThan(0);
    expect(dashboard.totalPaymentsMade).toBeLessThanOrEqual(result!.schedule.length);
  });
});
