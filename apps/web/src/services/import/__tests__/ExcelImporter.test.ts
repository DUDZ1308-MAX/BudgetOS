import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExcelImporter, excelImporter } from '@/services/import/ExcelImporter';

const mockSheetToJson = vi.fn();
const mockRead = vi.fn();

vi.mock('xlsx', () => ({
  default: {
    read: mockRead,
    utils: {
      sheet_to_json: mockSheetToJson,
    },
  },
  read: mockRead,
  utils: {
    sheet_to_json: mockSheetToJson,
  },
}));

describe('ExcelImporter', () => {
  beforeEach(() => {
    mockRead.mockReset();
    mockSheetToJson.mockReset();
  });

  it('parses an Excel file into worksheets', async () => {
    mockRead.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {},
      },
    });
    mockSheetToJson.mockReturnValue([
      { name: 'Test', amount: '100' },
      { name: 'Test2', amount: '200' },
    ]);

    const file = new File(['dummy'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await excelImporter.parse(file);
    expect(result.worksheets).toHaveLength(1);
    expect(result.worksheets[0]!.name).toBe('Sheet1');
    expect(result.worksheets[0]!.headers).toEqual(['name', 'amount']);
    expect(result.worksheets[0]!.rows).toHaveLength(2);
  });

  it('previews limited rows', async () => {
    mockRead.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    });
    mockSheetToJson.mockReturnValue([
      { a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 },
      { a: 6 }, { a: 7 }, { a: 8 }, { a: 9 }, { a: 10 },
      { a: 11 }, { a: 12 },
    ]);

    const file = new File(['dummy'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await excelImporter.preview(file, 5);
    expect(result.worksheets[0]!.rows).toHaveLength(5);
  });

  it('handles empty worksheets', async () => {
    mockRead.mockReturnValue({
      SheetNames: ['Empty'],
      Sheets: { Empty: {} },
    });
    mockSheetToJson.mockReturnValue([]);

    const file = new File(['dummy'], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await excelImporter.parse(file);
    expect(result.worksheets[0]!.rows).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });

  it('tracks total row count across worksheets', async () => {
    mockRead.mockReturnValue({
      SheetNames: ['A', 'B'],
      Sheets: { A: {}, B: {} },
    });
    mockSheetToJson
      .mockReturnValueOnce([{ v: 1 }, { v: 2 }])
      .mockReturnValueOnce([{ v: 3 }]);

    const file = new File(['dummy'], 'multi.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await excelImporter.parse(file);
    expect(result.totalRows).toBe(3);
  });
});
