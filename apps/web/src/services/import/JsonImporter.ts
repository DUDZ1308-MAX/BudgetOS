import type { ImportedRow, ParseResult } from './CsvImporter';

export class JsonImporter {
  async parse(file: File): Promise<{ data: Record<string, unknown[]>; fileName: string; entityTypes: string[] }> {
    const text = await file.text();
    const json = JSON.parse(text);

    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const entityTypes = Object.keys(json).filter(
        (k) => Array.isArray(json[k]) && !k.startsWith('_'),
      );
      return { data: json as Record<string, unknown[]>, fileName: file.name, entityTypes };
    }

    if (Array.isArray(json)) {
      return { data: { items: json }, fileName: file.name, entityTypes: ['items'] };
    }

    throw new Error('Unrecognized JSON format. Expected an object with entity arrays.');
  }

  validateStructure(data: Record<string, unknown[]>): { valid: boolean; entities: string[]; errors: string[] } {
    const validEntities = ['accounts', 'categories', 'transactions', 'budgets', 'savings_goals', 'mortgages'];
    const entities: string[] = [];
    const errors: string[] = [];

    for (const key of Object.keys(data)) {
      if (validEntities.includes(key)) {
        entities.push(key);
      }
    }

    if (entities.length === 0) {
      errors.push('No recognized entity types found. Expected one of: ' + validEntities.join(', '));
    }

    return { valid: errors.length === 0, entities, errors };
  }

  toRows(data: Record<string, unknown[]>, entityType: string): ParseResult {
    const items = data[entityType];
    if (!items || items.length === 0) {
      return { headers: [], rows: [], errors: [{ rowNumber: 0, message: `No data for entity: ${entityType}` }] };
    }

    const headers = Object.keys(items[0] as Record<string, unknown>);
    const rows: ImportedRow[] = items.map((item, idx) => ({
      rowNumber: idx + 1,
      data: item as Record<string, unknown>,
      raw: headers.map((h) => String((item as Record<string, unknown>)[h] ?? '')),
    }));

    return { headers, rows, errors: [] };
  }
}

export const jsonImporter = new JsonImporter();
