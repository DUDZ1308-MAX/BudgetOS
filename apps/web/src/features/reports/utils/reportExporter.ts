import { csvExporter, excelExporter, pdfExporter } from '@/services/export';
import type { ExportPayload } from '../reportTypes';

export async function exportReportCSV(payload: ExportPayload): Promise<void> {
  csvExporter.download(payload.headers, payload.rows, `${payload.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
}

export async function exportReportExcel(title: string, payloads: ExportPayload[]): Promise<void> {
  const worksheets = payloads.map((p) => ({
    name: p.title.slice(0, 31),
    headers: p.headers,
    rows: p.rows,
  }));
  await excelExporter.download(worksheets, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
}

export async function exportReportPDF(title: string, payloads: ExportPayload[]): Promise<void> {
  const subtitle = `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  await pdfExporter.download({
    title,
    subtitle,
    sections: payloads.map((p) => ({
      title: p.title,
      headers: p.headers,
      rows: p.rows,
    })),
    orientation: 'landscape',
    pageSize: 'letter',
  }, `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

export function buildCategoryExport(categoryData: Array<{ name: string; value: number; share: number }>): ExportPayload {
  return {
    title: 'Category Spending',
    headers: ['Category', 'Amount', 'Percentage'],
    rows: categoryData.map((c) => ({ Category: c.name, Amount: c.value, Percentage: `${c.share}%` })),
  };
}

export function buildMonthlyTrendExport(monthlyData: Array<{ month: string; income?: number; expenses?: number; net?: number }>): ExportPayload {
  return {
    title: 'Monthly Trend',
    headers: ['Month', 'Income', 'Expenses', 'Net'],
    rows: monthlyData.map((m) => ({ Month: m.month, Income: m.income ?? 0, Expenses: m.expenses ?? 0, Net: m.net ?? 0 })),
  };
}

export function buildBudgetExport(budgetData: Array<{ category: string; budgeted: number; spent: number; remaining: number }>): ExportPayload {
  return {
    title: 'Budget Performance',
    headers: ['Category', 'Budgeted', 'Spent', 'Remaining'],
    rows: budgetData.map((b) => ({ Category: b.category, Budgeted: b.budgeted, Spent: b.spent, Remaining: b.remaining })),
  };
}
