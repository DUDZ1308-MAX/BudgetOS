import type { ColumnMapping, ImportedRow } from './CsvImporter';
import { supabase } from '@/lib/supabase';

export type ImportTargetEntity = 'transactions' | 'categories' | 'budgets' | 'savings_goals' | 'mortgages';

const tableMap: Record<string, ImportTargetEntity> = {
  transaction: 'transactions',
  category: 'categories',
  budget: 'budgets',
  savings_goal: 'savings_goals',
  mortgage: 'mortgages',
};

export const defaultMappings: Record<string, ColumnMapping[]> = {
  transaction: [
    { sourceColumn: 'date', targetField: 'date', required: true },
    { sourceColumn: 'amount', targetField: 'amount', required: true },
    { sourceColumn: 'type', targetField: 'type', required: true },
    { sourceColumn: 'category', targetField: 'category_id', required: false },
    { sourceColumn: 'account', targetField: 'account_id', required: false },
    { sourceColumn: 'merchant', targetField: 'merchant', required: false },
    { sourceColumn: 'note', targetField: 'note', required: false },
  ],
  category: [
    { sourceColumn: 'name', targetField: 'name', required: true },
    { sourceColumn: 'type', targetField: 'type', required: true },
    { sourceColumn: 'icon', targetField: 'icon', required: false },
    { sourceColumn: 'color', targetField: 'color', required: false },
  ],
  budget: [
    { sourceColumn: 'category', targetField: 'category_id', required: true },
    { sourceColumn: 'year', targetField: 'year', required: true },
    { sourceColumn: 'month', targetField: 'month', required: true },
    { sourceColumn: 'amount', targetField: 'amount', required: true },
    { sourceColumn: 'rollover', targetField: 'rollover', required: false },
  ],
  savings_goal: [
    { sourceColumn: 'name', targetField: 'name', required: true },
    { sourceColumn: 'target_amount', targetField: 'target_amount', required: true },
    { sourceColumn: 'current_amount', targetField: 'current_amount', required: false },
    { sourceColumn: 'target_date', targetField: 'target_date', required: false },
    { sourceColumn: 'priority', targetField: 'priority', required: false },
  ],
  mortgage: [
    { sourceColumn: 'name', targetField: 'name', required: true },
    { sourceColumn: 'principal', targetField: 'principal', required: true },
    { sourceColumn: 'annual_rate', targetField: 'annual_rate', required: true },
    { sourceColumn: 'term_years', targetField: 'term_years', required: true },
    { sourceColumn: 'start_date', targetField: 'start_date', required: false },
    { sourceColumn: 'extra_payment', targetField: 'extra_payment', required: false },
  ],
};

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  entityType: string;
}

export class ImportMapper {
  mapRow(row: ImportedRow, mappings: ColumnMapping[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const mapping of mappings) {
      const rawValue = row.data[mapping.sourceColumn];
      const strValue = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : '';

      if (!strValue && mapping.defaultValue !== undefined) {
        result[mapping.targetField] = mapping.defaultValue;
        continue;
      }

      if (mapping.transform) {
        result[mapping.targetField] = mapping.transform(strValue);
      } else {
        result[mapping.targetField] = this.convertValue(mapping.targetField, strValue);
      }
    }
    return result;
  }

  async importRows(
    userId: string,
    rows: ImportedRow[],
    entityType: string,
    mappings: ColumnMapping[],
  ): Promise<ImportResult> {
    const table = tableMap[entityType];
    if (!table) throw new Error(`Unknown entity type: ${entityType}`);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const mapped = this.mapRow(row, mappings);
        const payload = { ...mapped, user_id: userId };

        const { error } = await supabase.from(table).insert(payload);
        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            errors.push(`Row ${row.rowNumber}: ${error.message}`);
            skipped++;
          }
        } else {
          imported++;
        }
      } catch (err) {
        errors.push(`Row ${row.rowNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        skipped++;
      }
    }

    return { imported, skipped, errors, entityType };
  }

  private convertValue(field: string, value: string): unknown {
    switch (field) {
      case 'amount':
      case 'target_amount':
      case 'current_amount':
      case 'principal':
      case 'annual_rate':
      case 'extra_payment':
        return parseFloat(value) || 0;

      case 'year':
      case 'month':
      case 'term_years':
        return parseInt(value, 10) || 0;

      case 'rollover':
        return value === 'true';

      case 'priority': {
        const p = parseInt(value, 10);
        return isNaN(p) ? 0 : p;
      }

      default:
        return value;
    }
  }
}

export const importMapper = new ImportMapper();
