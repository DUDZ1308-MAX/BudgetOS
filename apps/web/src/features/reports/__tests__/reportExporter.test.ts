import { describe, it, expect, vi } from 'vitest';
import { buildCategoryExport, buildMonthlyTrendExport, buildBudgetExport } from '../utils/reportExporter';

describe('reportExporter', () => {
  describe('buildCategoryExport', () => {
    it('returns ExportPayload with category data', () => {
      const catData = [{ name: 'Food', value: 500, share: 25 }, { name: 'Rent', value: 1500, share: 75 }];
      const result = buildCategoryExport(catData);
      expect(result.title).toBe('Category Spending');
      expect(result.headers).toContain('Category');
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.Category).toBe('Food');
    });
  });

  describe('buildMonthlyTrendExport', () => {
    it('returns ExportPayload with monthly data', () => {
      const data = [{ month: 'Jan', income: 5000, expenses: 3000, net: 2000 }];
      const result = buildMonthlyTrendExport(data);
      expect(result.title).toBe('Monthly Trend');
      expect(result.headers).toContain('Income');
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('buildBudgetExport', () => {
    it('returns ExportPayload with budget data', () => {
      const data = [{ category: 'Food', budgeted: 500, spent: 400, remaining: 100 }];
      const result = buildBudgetExport(data);
      expect(result.title).toBe('Budget Performance');
      expect(result.headers).toContain('Spent');
      expect(result.rows).toHaveLength(1);
    });
  });
});
