import { describe, it, expect, vi } from 'vitest';
import { ExcelExporter, excelExporter } from '@/services/export/ExcelExporter';

vi.mock('xlsx', () => ({
  default: {
    utils: {
      book_new: vi.fn(() => ({})),
      aoa_to_sheet: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    write: vi.fn(() => new Uint8Array([1, 2, 3])),
  },
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  write: vi.fn(() => new Uint8Array([1, 2, 3])),
}));

describe('ExcelExporter', () => {
  it('exports a blob with correct MIME type', async () => {
    const { blob } = await excelExporter.export([
      { name: 'Sheet1', headers: ['a', 'b'], rows: [{ a: 1, b: 2 }] },
    ]);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('generates filename with date if not provided', async () => {
    const { filename } = await excelExporter.export([
      { name: 'Sheet1', headers: ['a'], rows: [{ a: 1 }] },
    ]);
    expect(filename).toMatch(/export_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  it('uses provided filename', async () => {
    const { filename } = await excelExporter.export(
      [{ name: 'Sheet1', headers: ['a'], rows: [{ a: 1 }] }],
      'my_data.xlsx',
    );
    expect(filename).toBe('my_data.xlsx');
  });
});
