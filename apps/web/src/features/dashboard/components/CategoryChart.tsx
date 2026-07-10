import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency } from '@/services/transactionService';

const BAR_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6'];

interface CategoryChartProps {
  categories: { categoryName: string; amount: number }[];
  isLoading: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-900 dark:text-white">{payload[0].name}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export const CategoryChart = memo(function CategoryChart({ categories, isLoading }: CategoryChartProps) {
  return (
    <DashboardCard title="Top Spending Categories" subtitle="Current month">
      {isLoading ? (
        <SkeletonLoader lines={5} />
      ) : categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          No spending data for this month.
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 0, right: 0, left: -4, bottom: 0 }}
              barSize={20}
              barGap={4}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="categoryName"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {categories.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
});
