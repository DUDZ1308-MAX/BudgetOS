export interface ExcelWorksheet {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export class ExcelExporter {
  async export(worksheets: ExcelWorksheet[], filename?: string): Promise<{ blob: Blob; filename: string }> {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    for (const ws of worksheets) {
      const data: unknown[][] = [ws.headers];
      for (const row of ws.rows) {
        data.push(ws.headers.map((h) => row[h]));
      }
      const sheet = XLSX.utils.aoa_to_sheet(data);

      const colWidths = ws.headers.map((h) => {
        const headerLen = h.length;
        const maxDataLen = ws.rows.reduce((max, r) => {
          const val = String(r[h] ?? '');
          return Math.max(max, val.length);
        }, 0);
        return { wch: Math.max(headerLen, maxDataLen, 10) };
      });
      sheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, sheet, ws.name.slice(0, 31));
    }

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fn = filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`;
    return { blob, filename: fn };
  }

  async download(worksheets: ExcelWorksheet[], filename?: string): Promise<void> {
    const { blob, filename: fn } = await this.export(worksheets, filename);
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

export const excelExporter = new ExcelExporter();
