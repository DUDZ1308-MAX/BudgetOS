import { describe, it, expect } from 'vitest';
import {
  generateCashFlowInsights,
  generateSpendingInsights,
  generateBudgetInsights,
  generateSavingsInsights,
  generateNetWorthInsights,
  generateMortgageInsights,
  generateRecurringInsights,
} from '../utils/reportInsights';

describe('reportInsights', () => {
  describe('generateCashFlowInsights', () => {
    it('returns positive insight when cash flow is positive', () => {
      const insights = generateCashFlowInsights(5000, 3000, 2000);
      const positive = insights.find((i) => i.type === 'positive');
      expect(positive?.title).toMatch(/Positive Cash Flow/);
    });

    it('returns warning insight when cash flow is negative', () => {
      const insights = generateCashFlowInsights(3000, 5000, -2000);
      const warning = insights.find((i) => i.type === 'warning');
      expect(warning?.title).toMatch(/Cash Flow Deficit/);
    });

    it('returns high expense ratio warning when expenses exceed 90% of income', () => {
      const insights = generateCashFlowInsights(5000, 4800, 200);
      const warning = insights.find((i) => i.type === 'warning');
      expect(warning?.title).toMatch(/High Expense Ratio/);
    });
  });

  describe('generateSpendingInsights', () => {
    it('returns neutral insight for highest spending category', () => {
      const catData = [{ name: 'Food', value: 2000, share: 40 }];
      const insights = generateSpendingInsights(catData, 5000);
      const neutral = insights.find((i) => i.type === 'neutral');
      expect(neutral?.title).toMatch(/Highest Spending Category/);
    });
  });

  describe('generateBudgetInsights', () => {
    it('returns positive insight for under budget categories', () => {
      const insights = generateBudgetInsights(3, 0, 5, 85);
      const positive = insights.find((i) => i.type === 'positive');
      expect(positive?.title).toMatch(/On Track/i);
    });

    it('returns warning insight for overspent categories', () => {
      const insights = generateBudgetInsights(0, 2, 5, 70);
      const warning = insights.find((i) => i.type === 'warning');
      expect(warning?.title).toMatch(/Over Budget/);
    });
  });

  describe('generateSavingsInsights', () => {
    it('returns positive insight when savings are on track', () => {
      const insights = generateSavingsInsights(5000, 10000, 2, 3);
      const positive = insights.find((i) => i.type === 'positive');
      expect(positive).toBeDefined();
    });
  });

  describe('generateNetWorthInsights', () => {
    it('returns positive insight for positive net worth', () => {
      const insights = generateNetWorthInsights(50000);
      const positive = insights.find((i) => i.type === 'positive');
      expect(positive?.title).toMatch(/Net Worth/);
    });
  });

  describe('generateMortgageInsights', () => {
    it('returns insights with progress percentage', () => {
      const insights = generateMortgageInsights(25, 50000, 200000);
      expect(insights.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateRecurringInsights', () => {
    it('returns insight about recurring transactions', () => {
      const insights = generateRecurringInsights(5, 2000);
      const neutral = insights.find((i) => i.type === 'neutral');
      expect(neutral?.title).toMatch(/Recurring/);
    });
  });
});
