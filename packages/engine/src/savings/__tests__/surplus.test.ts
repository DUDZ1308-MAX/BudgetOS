import { describe, it, expect } from 'vitest';
import { calculateSurplus } from '../surplus';

describe('calculateSurplus', () => {
  it('returns positive surplus when income exceeds expenses plus sinking funds', () => {
    expect(calculateSurplus({ totalIncome: 5000_00, totalExpenses: 3000_00, sinkingFunds: 500_00 })).toBe(1500_00);
  });

  it('returns zero when income equals expenses plus sinking funds', () => {
    expect(calculateSurplus({ totalIncome: 3500_00, totalExpenses: 3000_00, sinkingFunds: 500_00 })).toBe(0);
  });

  it('returns negative when income is less than expenses plus sinking funds', () => {
    expect(calculateSurplus({ totalIncome: 3000_00, totalExpenses: 3000_00, sinkingFunds: 500_00 })).toBe(-500_00);
  });

  it('handles zero expenses and sinking funds', () => {
    expect(calculateSurplus({ totalIncome: 1000_00, totalExpenses: 0, sinkingFunds: 0 })).toBe(1000_00);
  });
});
