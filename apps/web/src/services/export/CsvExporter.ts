export type ExportEntityType = 'transaction' | 'category' | 'budget' | 'savings_goal' | 'mortgage';

export class CsvExporter {
  export(headers: string[], rows: Record<string, unknown>[], filename?: string): { csv: string; blob: Blob; filename: string } {
    const csv = this.toCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fn = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
    return { csv, blob, filename: fn };
  }

  download(headers: string[], rows: Record<string, unknown>[], filename?: string): void {
    const { blob, filename: fn } = this.export(headers, rows, filename);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private toCsv(headers: string[], rows: Record<string, unknown>[]): string {
    const escapeCell = (val: unknown): string => {
      const str = val !== null && val !== undefined ? String(val) : '';
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.map(escapeCell).join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escapeCell(row[h])).join(','));
    }
    return lines.join('\n');
  }
}

export const csvExporter = new CsvExporter();
