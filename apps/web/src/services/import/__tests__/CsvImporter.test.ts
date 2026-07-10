import { describe, it, expect } from 'vitest';
import { parseCSV, previewCSV, generateSampleCSV, CsvImporter, csvImporter } from '@/services/import/CsvImporter';

describe('CsvImporter', () => {
  describe('parseCSV', () => {
    it('parses a simple CSV with headers and rows', () => {
      const csv = 'name,amount,date\nGroceries,50.00,2025-01-15\nRent,1200,2025-02-01';
      const result = parseCSV(csv);
      expect(result.headers).toEqual(['name', 'amount', 'date']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]!.data).toEqual({ name: 'Groceries', amount: '50.00', date: '2025-01-15' });
      expect(result.rows[1]!.data).toEqual({ name: 'Rent', amount: '1200', date: '2025-02-01' });
    });

    it('handles quoted fields with commas', () => {
      const csv = 'name,note\nTest,"Has, comma"';
      const result = parseCSV(csv);
      expect(result.rows[0]!.data.note).toBe('Has, comma');
    });

    it('handles quoted fields with double quotes', () => {
      const csv = 'name,note\nTest,"Say ""hello"""';
      const result = parseCSV(csv);
      expect(result.rows[0]!.data.note).toBe('Say "hello"');
    });

    it('handles empty lines', () => {
      const csv = 'a,b\n1,2\n\n3,4\n';
      const result = parseCSV(csv);
      expect(result.rows).toHaveLength(2);
    });

    it('handles Windows line endings', () => {
      const csv = 'a,b\r\n1,2\r\n3,4';
      const result = parseCSV(csv);
      expect(result.rows).toHaveLength(2);
    });

    it('returns empty result for empty content', () => {
      const result = parseCSV('');
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('skips rows that are all empty', () => {
      const csv = 'a,b\n1,2\n,,\n3,4';
      const result = parseCSV(csv);
      expect(result.rows).toHaveLength(2);
    });
  });

  describe('previewCSV', () => {
    it('returns at most maxRows rows', () => {
      const csv = 'a\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12';
      const result = previewCSV(csv, 5);
      expect(result.rows).toHaveLength(5);
    });
  });

  describe('generateSampleCSV', () => {
    it('generates sample CSV for transaction type', () => {
      const csv = generateSampleCSV('transaction');
      expect(csv).toContain('date,amount,type,category,account,merchant,note');
      expect(csv).toContain('2025-01-15');
    });

    it('generates sample CSV for category type', () => {
      const csv = generateSampleCSV('category');
      expect(csv).toContain('name,type,icon,color');
    });

    it('generates sample CSV for budget type', () => {
      const csv = generateSampleCSV('budget');
      expect(csv).toContain('category,year,month,amount,rollover');
    });

    it('generates sample CSV for savings goal type', () => {
      const csv = generateSampleCSV('savings_goal');
      expect(csv).toContain('target_amount');
    });

    it('generates sample CSV for mortgage type', () => {
      const csv = generateSampleCSV('mortgage');
      expect(csv).toContain('principal,annual_rate,term_years');
    });
  });

  describe('CsvImporter class (singleton)', () => {
    it('parses via instance method', () => {
      const result = csvImporter.parse('a,b\n1,2');
      expect(result.headers).toEqual(['a', 'b']);
    });

    it('previews via instance method', () => {
      const result = csvImporter.preview('a\n1\n2\n3\n4\n5', 3);
      expect(result.rows).toHaveLength(3);
    });

    it('generates sample via instance method', () => {
      const csv = csvImporter.generateSample('mortgage');
      expect(csv).toContain('principal');
    });
  });
});
