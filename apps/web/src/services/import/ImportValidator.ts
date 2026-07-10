import type { ImportedRow, ColumnMapping } from './CsvImporter';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationMessage {
  rowNumber: number;
  severity: ValidationSeverity;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  messages: ValidationMessage[];
  duplicates: DuplicateInfo[];
}

export interface DuplicateInfo {
  rowNumber: number;
  matchField: string;
  matchValue: string;
}

export class ImportValidator {
  validate(
    rows: ImportedRow[],
    entityType: string,
    mappings: ColumnMapping[],
  ): ValidationResult {
    const messages: ValidationMessage[] = [];
    const seen = new Map<string, number[]>();
    const duplicates: DuplicateInfo[] = [];

    for (const row of rows) {
      for (const mapping of mappings) {
        const value = row.data[mapping.sourceColumn];
        const strValue = value !== null && value !== undefined ? String(value).trim() : '';

        if (mapping.required && !strValue) {
          messages.push({
            rowNumber: row.rowNumber,
            severity: 'error',
            field: mapping.sourceColumn,
            message: `${mapping.sourceColumn} is required but was empty`,
          });
          continue;
        }

        if (strValue) {
          const validationError = this.validateField(mapping.targetField, strValue, row.rowNumber);
          if (validationError) messages.push(validationError);
        }
      }

      const dedupKey = this.getDedupKey(row, entityType);
      if (dedupKey) {
        const existing = seen.get(dedupKey.key) ?? [];
        if (existing.length > 0) {
          duplicates.push({ rowNumber: row.rowNumber, matchField: dedupKey.field, matchValue: dedupKey.key });
          messages.push({
            rowNumber: row.rowNumber,
            severity: 'warning',
            field: dedupKey.field,
            message: `Duplicate ${dedupKey.field}: "${dedupKey.key}" also appears in row ${existing[0]}`,
          });
        }
        existing.push(row.rowNumber);
        seen.set(dedupKey.key, existing);
      }
    }

    const errorCount = messages.filter((m) => m.severity === 'error').length;
    const warningCount = messages.filter((m) => m.severity === 'warning').length;

    return {
      valid: errorCount === 0,
      rowCount: rows.length,
      errorCount,
      warningCount,
      messages,
      duplicates,
    };
  }

  private validateField(field: string, value: string, rowNumber: number): ValidationMessage | null {
    switch (field) {
      case 'amount':
      case 'target_amount':
      case 'current_amount':
      case 'principal':
      case 'extra_payment': {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid number` };
        }
        if (num < 0 && field !== 'amount') {
          return { rowNumber, severity: 'error', field, message: `"${field}" must not be negative` };
        }
        return null;
      }

      case 'annual_rate': {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid rate (0-100)` };
        }
        return null;
      }

      case 'term_years': {
        const years = parseInt(value, 10);
        if (isNaN(years) || years < 1 || years > 50) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid term (1-50 years)` };
        }
        return null;
      }

      case 'date':
      case 'target_date':
      case 'start_date': {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid date. Use YYYY-MM-DD` };
        }
        return null;
      }

      case 'year': {
        const y = parseInt(value, 10);
        if (isNaN(y) || y < 2000 || y > 2100) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid year` };
        }
        return null;
      }

      case 'month': {
        const m = parseInt(value, 10);
        if (isNaN(m) || m < 1 || m > 12) {
          return { rowNumber, severity: 'error', field, message: `"${value}" is not a valid month (1-12)` };
        }
        return null;
      }

      case 'type': {
        if (value !== 'income' && value !== 'expense') {
          return { rowNumber, severity: 'error', field, message: `"${value}" must be 'income' or 'expense'` };
        }
        return null;
      }

      case 'rollover': {
        if (value !== 'true' && value !== 'false') {
          return { rowNumber, severity: 'error', field, message: `"${value}" must be 'true' or 'false'` };
        }
        return null;
      }

      default:
        return null;
    }
  }

  private getDedupKey(row: ImportedRow, entityType: string): { key: string; field: string } | null {
    switch (entityType) {
      case 'transaction': {
        const date = row.data.date;
        const amount = row.data.amount;
        const merchant = row.data.merchant;
        if (date && amount) {
          return { key: `${date}|${amount}|${merchant ?? ''}`, field: 'date+amount+merchant' };
        }
        return null;
      }
      case 'category': {
        const name = row.data.name;
        return name ? { key: String(name).toLowerCase().trim(), field: 'name' } : null;
      }
      case 'budget': {
        const cat = row.data.category;
        const year = row.data.year;
        const month = row.data.month;
        if (cat && year && month) {
          return { key: `${String(cat).toLowerCase()}|${year}|${month}`, field: 'category+year+month' };
        }
        return null;
      }
      default:
        return null;
    }
  }

  estimateChanges(rows: ImportedRow[], entityType: string): ImportEstimate {
    return {
      totalRows: rows.length,
      estimatedNew: rows.length,
      estimatedUpdates: 0,
      estimatedDuplicates: 0,
      entityType,
    };
  }
}

export interface ImportEstimate {
  totalRows: number;
  estimatedNew: number;
  estimatedUpdates: number;
  estimatedDuplicates: number;
  entityType: string;
}

export const importValidator = new ImportValidator();
