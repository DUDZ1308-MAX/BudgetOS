export type ReportTab = 'monthly' | 'income' | 'expenses' | 'category' | 'cashflow' | 'budget' | 'savings' | 'mortgage' | 'debt' | 'networth' | 'recurring' | 'forecast';

export type TimeRange = '30d' | '90d' | '6m' | '1y' | 'all';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'stacked';

export interface ReportFilters {
  dateRange: { start: string; end: string };
  timeRange: TimeRange;
  accountId: string | null;
  categoryId: string | null;
  budgetId: string | null;
  type: 'all' | 'income' | 'expense';
}

export interface ReportFilterState {
  tab: ReportTab;
  timeRange: TimeRange;
  accountId: string | null;
  categoryId: string | null;
  budgetId: string | null;
  type: 'all' | 'income' | 'expense';
}

export interface ChartSeries {
  name: string;
  dataKey: string;
  color: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartConfig {
  title: string;
  type: ChartType;
  data: Record<string, unknown>[];
  series: ChartSeries[];
  xKey: string;
  height?: number;
}

export interface KpiMetric {
  label: string;
  value: string;
  change?: { value: string; positive: boolean; label?: string };
  color?: string;
}

export interface ReportInsight {
  type: 'positive' | 'neutral' | 'warning';
  title: string;
  message: string;
  metric?: string;
}

export interface ReportData {
  kpis: KpiMetric[];
  charts: ChartConfig[];
  insights: ReportInsight[];
  tableHeaders?: string[];
  tableRows?: Record<string, unknown>[];
  isEmpty?: boolean;
}

export interface ExportPayload {
  title: string;
  headers: string[];
  rows: Record<string, unknown>[];
  filters?: ReportFilters;
}
