export type ImportEntityType = 'transaction' | 'category' | 'budget' | 'savings_goal' | 'mortgage';

export interface ImportedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  raw: string[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  defaultValue?: unknown;
  transform?: (value: string) => unknown;
}

export interface ParseResult {
  headers: string[];
  rows: ImportedRow[];
  errors: ParseError[];
}

export interface ParseError {
  rowNumber: number;
  message: string;
  column?: string;
}

export function parseCSV(content: string): ParseResult {
  const trimmed = content.trim();
  if (!trimmed) return { headers: [], rows: [], errors: [] };

  const lines = splitLines(trimmed);
  const headers = parseLine(lines[0]!);
  const rows: ImportedRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const values = parseLine(line);
    const row: Record<string, unknown> = {};
    let allEmpty = true;

    for (let j = 0; j < headers.length; j++) {
      const value = values[j] ?? '';
      if (value !== '') allEmpty = false;
      row[headers[j]!] = value;
    }

    if (allEmpty) continue;

    rows.push({ rowNumber: i + 1, data: row, raw: values });
  }

  return { headers, rows, errors };
}

export function previewCSV(content: string, maxRows: number = 10): ParseResult {
  const lines = splitLines(content);
  if (lines.length === 0) return { headers: [], rows: [], errors: [] };

  const headers = parseLine(lines[0]!);
  const rows: ImportedRow[] = [];
  const errors: ParseError[] = [];
  const previewLines = lines.slice(1, Math.min(lines.length, maxRows + 1));

  for (let i = 0; i < previewLines.length; i++) {
    const line = previewLines[i]!.trim();
    if (!line) continue;

    const values = parseLine(line);
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] ?? '';
    }
    rows.push({ rowNumber: i + 2, data: row, raw: values });
  }

  return { headers, rows, errors };
}

export function generateSampleCSV(entityType: ImportEntityType): string {
  const templates: Record<ImportEntityType, { headers: string[]; sample: string[] }> = {
    transaction: {
      headers: ['date', 'amount', 'type', 'category', 'account', 'merchant', 'note'],
      sample: ['2025-01-15', '150.00', 'expense', 'Groceries', 'Checking', 'Walmart', 'Weekly groceries'],
    },
    category: {
      headers: ['name', 'type', 'icon', 'color'],
      sample: ['Groceries', 'expense', 'shopping-cart', '#ef4444'],
    },
    budget: {
      headers: ['category', 'year', 'month', 'amount', 'rollover'],
      sample: ['Groceries', '2025', '1', '500', 'false'],
    },
    savings_goal: {
      headers: ['name', 'target_amount', 'current_amount', 'target_date', 'priority'],
      sample: ['Emergency Fund', '10000', '2500', '2025-12-31', 'high'],
    },
    mortgage: {
      headers: ['name', 'principal', 'annual_rate', 'term_years', 'start_date', 'extra_payment'],
      sample: ['Home Loan', '300000', '6.5', '30', '2024-01-01', '0'],
    },
  };

  const t = templates[entityType];
  return [t.headers.join(','), t.sample.join(',')].join('\n');
}

function splitLines(content: string): string[] {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

export class CsvImporter {
  parse(content: string): ParseResult {
    return parseCSV(content);
  }

  preview(content: string, maxRows?: number): ParseResult {
    return previewCSV(content, maxRows);
  }

  generateSample(entityType: ImportEntityType): string {
    return generateSampleCSV(entityType);
  }
}

export const csvImporter = new CsvImporter();
