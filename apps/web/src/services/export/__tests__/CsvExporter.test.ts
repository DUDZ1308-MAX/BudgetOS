import { describe, it, expect } from 'vitest';
import { csvExporter } from '@/services/export/CsvExporter';

describe('CsvExporter', () => {
  it('generates CSV string with headers and rows', () => {
    const { csv } = csvExporter.export(
      ['name', 'amount'],
      [{ name: 'Groceries', amount: 50 }, { name: 'Rent', amount: 1200 }],
    );
    expect(csv).toContain('name,amount');
    expect(csv).toContain('Groceries,50');
    expect(csv).toContain('Rent,1200');
  });

  it('escapes cells containing commas', () => {
    const { csv } = csvExporter.export(
      ['name', 'note'],
      [{ name: 'Test', note: 'Has, comma' }],
    );
    expect(csv).toContain('"Has, comma"');
  });

  it('escapes cells containing double quotes', () => {
    const { csv } = csvExporter.export(
      ['name'],
      [{ name: 'Say "hello"' }],
    );
    expect(csv).toContain('"Say ""hello"""');
  });

  it('returns blob with correct MIME type', () => {
    const { blob } = csvExporter.export(['a'], [{ a: 1 }]);
    expect(blob.type).toBe('text/csv;charset=utf-8;');
  });

  it('generates filename with date if not provided', () => {
    const { filename } = csvExporter.export(['a'], [{ a: 1 }]);
    expect(filename).toMatch(/export_\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('uses provided filename', () => {
    const { filename } = csvExporter.export(['a'], [{ a: 1 }], 'my_data.csv');
    expect(filename).toBe('my_data.csv');
  });

  it('handles empty rows', () => {
    const { csv } = csvExporter.export(['a', 'b'], []);
    expect(csv).toBe('a,b');
  });
});
