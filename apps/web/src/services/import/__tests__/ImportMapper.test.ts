import { describe, it, expect } from 'vitest';
import { ImportMapper, importMapper, defaultMappings } from '@/services/import/ImportMapper';
import type { ImportedRow } from '@/services/import/CsvImporter';

describe('ImportMapper', () => {
  describe('mapRow', () => {
    it('maps fields using column mappings', () => {
      const row: ImportedRow = {
        rowNumber: 1,
        data: { name: 'Groceries', type: 'expense', icon: 'cart', color: '#f00' },
        raw: [],
      };
      const result = importMapper.mapRow(row, defaultMappings['category']!);
      expect(result.name).toBe('Groceries');
      expect(result.type).toBe('expense');
      expect(result.icon).toBe('cart');
      expect(result.color).toBe('#f00');
    });

    it('converts numeric fields', () => {
      const row: ImportedRow = {
        rowNumber: 1,
        data: { date: '2025-01-15', amount: '150.50', type: 'expense', category: '1', merchant: 'Store' },
        raw: [],
      };
      const result = importMapper.mapRow(row, defaultMappings['transaction']!);
      expect(result.amount).toBe(150.5);
    });

    it('handles rollover boolean conversion', () => {
      const row: ImportedRow = {
        rowNumber: 1,
        data: { category: '1', year: '2025', month: '1', amount: '500', rollover: 'true' },
        raw: [],
      };
      const result = importMapper.mapRow(row, defaultMappings['budget']!);
      expect(result.rollover).toBe(true);
    });

    it('uses default value when field is empty', () => {
      const row: ImportedRow = {
        rowNumber: 1,
        data: { name: 'Test', target_amount: '1000' },
        raw: [],
      };
      const mappings = [
        { sourceColumn: 'name', targetField: 'name', required: true },
        { sourceColumn: 'priority', targetField: 'priority', required: false, defaultValue: 0 },
      ];
      const result = importMapper.mapRow(row, mappings);
      expect(result.priority).toBe(0);
    });

    it('applies custom transform function', () => {
      const row: ImportedRow = {
        rowNumber: 1,
        data: { name: 'TEST' },
        raw: [],
      };
      const mappings = [
        { sourceColumn: 'name', targetField: 'name', required: true, transform: (v: string) => v.toLowerCase() },
      ];
      const result = importMapper.mapRow(row, mappings);
      expect(result.name).toBe('test');
    });
  });

  describe('defaultMappings', () => {
    it('defines mappings for all entity types', () => {
      expect(defaultMappings.transaction).toBeDefined();
      expect(defaultMappings.category).toBeDefined();
      expect(defaultMappings.budget).toBeDefined();
      expect(defaultMappings.savings_goal).toBeDefined();
      expect(defaultMappings.mortgage).toBeDefined();
    });

    it('marks required fields', () => {
      const required = defaultMappings['transaction']!.filter((m) => m.required);
      expect(required.map((r) => r.sourceColumn)).toContain('date');
      expect(required.map((r) => r.sourceColumn)).toContain('amount');
      expect(required.map((r) => r.sourceColumn)).toContain('type');
    });

    it('strips sensitive fields from mortgage mapping', () => {
      const fields = defaultMappings['mortgage']!.map((m) => m.targetField);
      expect(fields).toContain('principal');
      expect(fields).toContain('annual_rate');
      expect(fields).toContain('term_years');
    });
  });
});
