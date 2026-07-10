export interface JsonExportData {
  _exportedAt: string;
  _version: string;
  transactions: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  savings_goals: Record<string, unknown>[];
  mortgages: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
}

export class JsonExporter {
  buildExport(
    transactions: Record<string, unknown>[],
    categories: Record<string, unknown>[],
    budgets: Record<string, unknown>[],
    savings_goals: Record<string, unknown>[],
    mortgages: Record<string, unknown>[],
    accounts: Record<string, unknown>[] = [],
  ): JsonExportData {
    return {
      _exportedAt: new Date().toISOString(),
      _version: '1.0',
      transactions,
      categories,
      budgets,
      savings_goals,
      mortgages,
      accounts,
    };
  }

  export(
    data: JsonExportData,
    filename?: string,
    pretty: boolean = true,
  ): { json: string; blob: Blob; filename: string } {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const fn = filename || `budgetos_backup_${new Date().toISOString().split('T')[0]}.json`;
    return { json, blob, filename: fn };
  }

  download(
    data: JsonExportData,
    filename?: string,
    pretty?: boolean,
  ): void {
    const { blob, filename: fn } = this.export(data, filename, pretty);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const jsonExporter = new JsonExporter();
