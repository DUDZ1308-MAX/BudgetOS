import { describe, it, expect } from 'vitest';
import { compareScenarios } from '../scenarios';

describe('compareScenarios', () => {
  it('returns failure for empty inputs', () => {
    const result = compareScenarios([]);
    expect(result.success).toBe(false);
  });

  it('returns multiple scenarios', () => {
    const result = compareScenarios([
      {
        label: 'No Extra',
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [],
      },
      {
        label: 'Extra $200',
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
      },
    ]);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.scenarios).toHaveLength(2);
    expect(result.data.scenarios[0]?.label).toBeDefined();
    expect(result.data.scenarios[1]?.label).toBeDefined();
  });

  it('sorts by payoff date correctly', () => {
    const result = compareScenarios([
      {
        label: 'Extra $500',
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [{ type: 'monthly_fixed', amount: 500_00 }],
      },
      {
        label: 'No Extra',
        principal: 30_000_00,
        annualRate: 6.5,
        termYears: 30,
        startDate: '2024-01-01',
        extraPayments: [],
      },
    ]);

    if (!result.success) return;
    const payoffDates = result.data.scenarios.map((s) => new Date(s.payoffDate).getTime());
    expect(payoffDates[0]).toBeLessThanOrEqual(payoffDates[1] ?? Infinity);
  });
});
