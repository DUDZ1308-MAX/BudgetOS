import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
      }}
      role="tooltip"
    >
      <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
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
      <DashboardCard title="Cash Flow Trend" delay={0.15}>
        <div className="h-64 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title="Cash Flow Trend" delay={0.15}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No cash flow data yet.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Cash Flow Trend"
      subtitle={`${data.length} month${data.length !== 1 ? 's' : ''} overview`}
      delay={0.15}
    >
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Income: {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Expenses: {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            Net: {formatCurrency(netCashFlow)}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-64 chart-depth"
        aria-label="Cash flow area chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="expenseAreaGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="incomeStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="expenseStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(0)}k` : Math.abs(v).toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-muted)' }} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="url(#incomeStrokeGrad)"
              fill="url(#incomeAreaGrad)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#10b981', fill: 'var(--bg-card)' }}
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="url(#expenseStrokeGrad)"
              fill="url(#expenseAreaGrad)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#ef4444', fill: 'var(--bg-card)' }}
              animationDuration={1200}
              animationBegin={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </DashboardCard>
  );
});
