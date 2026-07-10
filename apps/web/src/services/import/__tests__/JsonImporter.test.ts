import { describe, it, expect, vi } from 'vitest';
import { JsonImporter, jsonImporter } from '@/services/import/JsonImporter';

describe('JsonImporter', () => {
  it('parses structured JSON file', async () => {
    const file = new File(
      [JSON.stringify({ transactions: [{ id: 1, amount: 50 }], categories: [] })],
      'backup.json',
      { type: 'application/json' },
    );
    const result = await jsonImporter.parse(file);
    expect(result.entityTypes).toContain('transactions');
    expect(result.fileName).toBe('backup.json');
  });

  it('validates structure with known entity types', () => {
    const result = jsonImporter.validateStructure({
      transactions: [{ id: 1 }],
      categories: [{ id: 2 }],
      custom_data: [],
    });
    expect(result.valid).toBe(true);
    expect(result.entities).toEqual(['transactions', 'categories']);
  });

  it('flags unknown structure as invalid', () => {
    const result = jsonImporter.validateStructure({
      random_data: [{ foo: 'bar' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('converts entity to rows', () => {
    const rows = jsonImporter.toRows(
      { transactions: [{ id: 1, amount: 50, date: '2025-01-15' }] },
      'transactions',
    );
    expect(rows.headers).toEqual(['id', 'amount', 'date']);
    expect(rows.rows).toHaveLength(1);
  });

  it('handles empty entity data', () => {
    const rows = jsonImporter.toRows({ transactions: [] }, 'transactions');
    expect(rows.rows).toHaveLength(0);
    expect(rows.errors.length).toBeGreaterThan(0);
  });

  it('rejects array-only JSON', async () => {
    const file = new File(
      [JSON.stringify([{ id: 1 }])],
      'array.json',
      { type: 'application/json' },
    );
    const result = await jsonImporter.parse(file);
    expect(result.entityTypes).toEqual(['items']);
  });
});
