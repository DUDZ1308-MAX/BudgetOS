import { describe, it, expect } from 'vitest';
import { ImportValidator, importValidator } from '@/services/import/ImportValidator';
import type { ColumnMapping, ImportedRow } from '@/services/import/CsvImporter';

const basicMappings: ColumnMapping[] = [
  { sourceColumn: 'name', targetField: 'name', required: true },
  { sourceColumn: 'amount', targetField: 'amount', required: true },
  { sourceColumn: 'type', targetField: 'type', required: true },
  { sourceColumn: 'date', targetField: 'date', required: false },
];

describe('ImportValidator', () => {
  describe('validate', () => {
    it('passes valid rows', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: 'Test', amount: '100', type: 'income', date: '2025-01-15' }, raw: [] },
      ];
      const result = importValidator.validate(rows, 'transaction', basicMappings);
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('flags missing required fields as errors', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: '', amount: '', type: '', date: '' }, raw: [] },
      ];
      const result = importValidator.validate(rows, 'transaction', basicMappings);
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBeGreaterThanOrEqual(3);
    });

    it('validates amount field format', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: 'Test', amount: 'not_a_number', type: 'income' }, raw: [] },
      ];
      const result = importValidator.validate(rows, 'transaction', basicMappings);
      expect(result.messages[0]!.message).toContain('not a valid number');
    });

    it('validates date format', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: 'Test', amount: '100', type: 'income', date: 'not-a-date' }, raw: [] },
      ];
      const result = importValidator.validate(rows, 'transaction', basicMappings);
      expect(result.messages[0]!.message).toContain('not a valid date');
    });

    it('validates income/expense type', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: 'Test', amount: '100', type: 'invalid' }, raw: [] },
      ];
      const result = importValidator.validate(rows, 'transaction', basicMappings);
      expect(result.messages[0]!.message).toContain("must be 'income' or 'expense'");
    });

    it('detects duplicate transactions', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { date: '2025-01-15', amount: '50', merchant: 'Store', type: 'expense' }, raw: [] },
        { rowNumber: 2, data: { date: '2025-01-15', amount: '50', merchant: 'Store', type: 'expense' }, raw: [] },
      ];
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'date', targetField: 'date', required: true },
        { sourceColumn: 'amount', targetField: 'amount', required: true },
        { sourceColumn: 'type', targetField: 'type', required: true },
      ];
      const result = importValidator.validate(rows, 'transaction', mappings);
      expect(result.duplicates).toHaveLength(1);
      expect(result.messages.some((m) => m.message.includes('Duplicate'))).toBe(true);
    });

    it('validates year field', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { category: 'Test', year: '1899', month: '1', amount: '100' }, raw: [] },
      ];
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'year', targetField: 'year', required: true },
      ];
      const result = importValidator.validate(rows, 'budget', mappings);
      expect(result.valid).toBe(false);
    });

    it('validates month field', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { category: 'Test', year: '2025', month: '13', amount: '100' }, raw: [] },
      ];
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'month', targetField: 'month', required: true },
      ];
      const result = importValidator.validate(rows, 'budget', mappings);
      expect(result.valid).toBe(false);
    });

    it('validates rollover boolean', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { rollover: 'yes' }, raw: [] },
      ];
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'rollover', targetField: 'rollover', required: true },
      ];
      const result = importValidator.validate(rows, 'budget', mappings);
      expect(result.valid).toBe(false);
    });
  });

  describe('estimateChanges', () => {
    it('returns estimate with row count', () => {
      const rows: ImportedRow[] = [
        { rowNumber: 1, data: { name: 'Test' }, raw: [] },
      ];
      const est = importValidator.estimateChanges(rows, 'category');
      expect(est.totalRows).toBe(1);
      expect(est.entityType).toBe('category');
    });
  });
});
