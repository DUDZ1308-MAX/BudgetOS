import { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface CashFlowDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface Props {
  data: CashFlowDataPoint[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p: any) => p.dataKey === 'income');
  const expenses = payload.find((p: any) => p.dataKey === 'expenses');
  const net = payload.find((p: any) => p.dataKey === 'net');
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-800" role="tooltip">
      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-white">{label}</p>
      <div className="space-y-1">
        {income && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Income: {formatCurrency(income.value)}
          </p>
        )}
        {expenses && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            Expenses: {formatCurrency(Math.abs(expenses.value))}
          </p>
        )}
        {net && (
          <p className={`text-xs font-semibold ${net.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            Net: {formatCurrency(net.value)}
          </p>
        )}
      </div>
    </div>
  );
}

export const AnimatedCashFlow = memo(function AnimatedCashFlow({ data, isLoading }: Props) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      expenses: -Math.abs(d.expenses),
      net: d.income - d.expenses,
    }));
  }, [data]);

  const totalIncome = useMemo(() => data.reduce((s, d) => s + d.income, 0), [data]);
  const totalExpenses = useMemo(() => data.reduce((s, d) => s + d.expenses, 0), [data]);
  const netCashFlow = totalIncome - totalExpenses;

  if (isLoading) {
    return (
      <DashboardCard title="Cash Flow Trend">
        <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title="Cash Flow Trend">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No cash flow data yet.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Cash Flow Trend"
      subtitle={`${data.length} month${data.length !== 1 ? 's' : ''} overview`}
    >
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Income: {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Expenses: {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Net: {formatCurrency(netCashFlow)}
          </span>
        </div>
      </div>

      <div className="h-64" aria-label="Cash flow bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(0)}k` : Math.abs(v).toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
            <Bar dataKey="income" fill="url(#incomeGrad)" radius={[4, 4, 0, 0]} barSize={20} name="Income" animationDuration={800} />
            <Bar dataKey="expenses" fill="url(#expenseGrad)" radius={[0, 0, 4, 4]} barSize={20} name="Expenses" animationDuration={800} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
});
