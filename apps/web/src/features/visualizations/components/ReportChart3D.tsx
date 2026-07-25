import { useMemo } from 'react';
import type { ChartConfig } from '@/features/reports/reportTypes';
import { NetWorth3DLazy, CashFlow3DLazy, Spending3DLazy, BudgetProgress3DLazy } from './LazyScene3D';
import type { NetWorth3DData, CashFlow3DData, SpendingCategory3D, BudgetProgress3DData, FinancialHealth3DData } from '../visualizationTypes';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

interface ReportChart3DProps {
  config: ChartConfig;
}

function chartConfigTo3D(config: ChartConfig) {
  const lastRow = config.data[config.data.length - 1] || {};

  switch (config.type) {
    case 'pie': {
      const cats: SpendingCategory3D[] = config.data.map((row, i) => ({
        name: String(row[config.xKey] || ''),
        amount: Number(row[Object.keys(row).find((k) => k !== config.xKey) || 'value']) || 0,
        color: COLORS[i % COLORS.length]!,
        percent: 0,
      }));
      const total = cats.reduce((s, c) => s + c.amount, 0);
      cats.forEach((c) => { c.percent = total > 0 ? (c.amount / total) * 100 : 0; });
      return {
        render: <Spending3DLazy categories={cats} height={config.height || 250} />,
      };
    }

    case 'stacked': {
      const items: BudgetProgress3DData[] = config.data.map((row) => {
        const label = String(row[config.xKey] || '');
        const spent = Number(row['spent'] || row['actual'] || 0);
        const budgeted = Number(row['budgeted'] || row['target'] || row['goal'] || 0);
        return {
          label,
          budgeted,
          spent,
          remaining: budgeted - spent,
          percentUsed: budgeted > 0 ? (spent / budgeted) * 100 : 0,
        };
      });
      return {
        render: <BudgetProgress3DLazy data={items} height={config.height || 250} />,
      };
    }

    case 'bar': {
      const hasBudgetField = config.series.some((s) => s.dataKey.toLowerCase().includes('budget') || s.dataKey.toLowerCase().includes('target'));
      const hasSavedField = config.series.some((s) => s.dataKey.toLowerCase().includes('saved'));
      const hasSpentField = config.series.some((s) => s.dataKey.toLowerCase() === 'spent');

      if (hasBudgetField && (hasSpentField || hasSavedField)) {
        const items: BudgetProgress3DData[] = config.data.map((row) => {
          const label = String(row[config.xKey] || '');
          const budgetKey = config.series.find((s) => s.dataKey.toLowerCase().includes('budget') || s.dataKey.toLowerCase().includes('target'));
          const spentKey = config.series.find((s) => s.dataKey.toLowerCase() === 'spent' || s.dataKey.toLowerCase() === 'saved');
          const budgeted = budgetKey ? Number(row[budgetKey.dataKey]) || 0 : 0;
          const spent = spentKey ? Number(row[spentKey.dataKey]) || 0 : 0;
          return { label, budgeted, spent, remaining: budgeted - spent, percentUsed: budgeted > 0 ? (spent / budgeted) * 100 : 0 };
        });
        return { render: <BudgetProgress3DLazy data={items} height={config.height || 250} /> };
      }

      const incomeKey = config.series.find((s) => s.dataKey.toLowerCase().includes('income'));
      const expenseKey = config.series.find((s) => s.dataKey.toLowerCase().includes('expense') || s.dataKey.toLowerCase().includes('expenses'));
      const netKey = config.series.find((s) => s.dataKey.toLowerCase().includes('net') || s.dataKey.toLowerCase().includes('savings'));
      const income = incomeKey ? Number(lastRow[incomeKey.dataKey]) || 0 : 0;
      const expenses = expenseKey ? Math.abs(Number(lastRow[expenseKey.dataKey])) || 0 : 0;
      const net = netKey ? Number(lastRow[netKey.dataKey]) || 0 : income - expenses;
      return {
        render: (
          <CashFlow3DLazy
            data={{ income, expenses, savings: net > 0 ? net : 0, remaining: net }}
            height={config.height || 250}
          />
        ),
      };
    }

    case 'line':
    case 'area': {
      const seriesKeys = config.series.map((s) => s.dataKey.toLowerCase());

      if (seriesKeys.includes('networth') || seriesKeys.includes('balance')) {
        const valKey = config.series.find(
          (s) => s.dataKey.toLowerCase().includes('networth') || s.dataKey.toLowerCase().includes('balance') || s.dataKey.toLowerCase().includes('net'),
        );
        const val = valKey ? Number(lastRow[valKey.dataKey]) || 0 : 0;
        return {
          render: (
            <NetWorth3DLazy
              data={{ assets: val > 0 ? val : 0, liabilities: val < 0 ? Math.abs(val) : 0, netWorth: val }}
              height={config.height || 250}
            />
          ),
        };
      }

      const incomeKey = config.series.find((s) => s.dataKey.toLowerCase().includes('income'));
      const expenseKey = config.series.find((s) => s.dataKey.toLowerCase().includes('expense') || s.dataKey.toLowerCase().includes('expenses'));
      const netKey = config.series.find((s) => s.dataKey.toLowerCase().includes('net'));
      const singleKey = config.series.length === 1 ? config.series[0] : null;

      const income = incomeKey ? Number(lastRow[incomeKey.dataKey]) || 0 : 0;
      const expenses = expenseKey ? Math.abs(Number(lastRow[expenseKey.dataKey])) || 0 : 0;
      const net = netKey ? Number(lastRow[netKey.dataKey]) || 0 : (singleKey ? Number(lastRow[singleKey.dataKey]) || 0 : income - expenses);

      return {
        render: (
          <CashFlow3DLazy
            data={{ income, expenses, savings: net > 0 ? net : 0, remaining: net }}
            height={config.height || 250}
          />
        ),
      };
    }

    default:
      return null;
  }
}

export function ReportChart3D({ config }: ReportChart3DProps) {
  const result = useMemo(() => chartConfigTo3D(config), [config]);
  if (!result) return null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{config.title}</h3>
      {result.render}
    </div>
  );
}
