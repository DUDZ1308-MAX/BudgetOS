import type { ImportedRow, ParseResult, ParseError } from './CsvImporter';

interface WorksheetData {
  name: string;
  headers: string[];
  rows: ImportedRow[];
}

export interface ExcelParseResult {
  worksheets: WorksheetData[];
  totalRows: number;
  errors: ParseError[];
}

export class ExcelImporter {
  async parse(file: File): Promise<ExcelParseResult> {
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheets: WorksheetData[] = [];
    const errors: ParseError[] = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName!]!;
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (jsonData.length === 0) {
        worksheets.push({ name: sheetName!, headers: [], rows: [] });
        continue;
      }

      const headers = Object.keys(jsonData[0]!);
      const rows: ImportedRow[] = jsonData.map((row, idx) => ({
        rowNumber: idx + 2,
        data: row,
        raw: headers.map((h) => String(row[h] ?? '')),
      }));

      totalRows += rows.length;
      worksheets.push({ name: sheetName!, headers, rows });
    }

    return { worksheets, totalRows, errors };
  }

  async preview(file: File, maxRows: number = 10): Promise<ExcelParseResult> {
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheets: WorksheetData[] = [];
    const errors: ParseError[] = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName!]!;
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        range: 0, // headers only
      });

      const allData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (allData.length === 0) {
        worksheets.push({ name: sheetName!, headers: [], rows: [] });
        continue;
      }

      const headers = Object.keys(allData[0]!);
      const previewRows = allData.slice(0, maxRows).map((row, idx) => ({
        rowNumber: idx + 2,
        data: row,
        raw: headers.map((h) => String(row[h] ?? '')),
      }));

      totalRows += allData.length;
      worksheets.push({ name: sheetName!, headers, rows: previewRows });
    }

    return { worksheets, totalRows, errors };
  }
}

export const excelImporter = new ExcelImporter();
