import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency } from '@/services/transactionService';
import type { CategoryBudgetStatus } from '@/lib/dashboard/types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

interface BudgetChartProps {
  budgets: CategoryBudgetStatus[];
  isLoading: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-900 dark:text-white">{d.name}</p>
      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(d.value)}</p>
    </div>
  );
}

export const BudgetChart = memo(function BudgetChart({ budgets, isLoading }: BudgetChartProps) {
  const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pctUsed = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const pieData = budgets.map((b) => ({
    name: b.categoryName,
    value: b.budgeted,
    spent: b.spent,
  }));

  return (
    <DashboardCard
      title="Budget Overview"
      subtitle={totalBudgeted > 0 ? `${formatCurrency(totalSpent)} of ${formatCurrency(totalBudgeted)} used` : 'No budgets set'}
    >
      {isLoading ? (
        <SkeletonLoader lines={4} />
      ) : budgets.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Create a budget to see your spending breakdown.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            {budgets.map((b, i) => (
              <div key={b.categoryId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate text-slate-700 dark:text-slate-300">{b.categoryName}</span>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {b.percentUsed > 100 ? (
                      <span className="font-medium text-red-500 dark:text-red-400">{b.percentUsed.toFixed(0)}%</span>
                    ) : (
                      `${b.percentUsed.toFixed(0)}%`
                    )}
                  </span>
                </div>
                <span className="ml-2 shrink-0 font-medium tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(b.spent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  );
});
