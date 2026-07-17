import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(8px)',
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
    </motion.div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload?.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export const AnimatedCashFlow = memo(function AnimatedCashFlow({ data, isLoading }: Props) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      expenses: -Math.abs(d.expenses),
    }));
  }, [data]);

  const totals = useMemo(() => {
    const totalIncome = data.reduce((s, d) => s + d.income, 0);
    const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
    const netCashFlow = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netCashFlow };
  }, [data]);

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
      accent="top"
      delay={0.15}
    >
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Income: {formatCurrency(totals.totalIncome)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" style={{ boxShadow: '0 0 6px rgba(248, 113, 113, 0.4)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Expenses: {formatCurrency(totals.totalExpenses)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${totals.netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ boxShadow: `0 0 6px ${totals.netCashFlow >= 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}` }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            Net: {formatCurrency(totals.netCashFlow)}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-64 chart-depth-lg"
        aria-label="Cash flow bar and line chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5} />
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
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="income"
              fill="url(#incomeBarGrad)"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              name="Income"
            />
            <Bar
              dataKey="expenses"
              fill="url(#expenseBarGrad)"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={200}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, stroke: '#6366f1', fill: 'var(--bg-card)' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#6366f1', fill: 'var(--bg-card)' }}
              animationDuration={1200}
              animationBegin={400}
              name="Net Cash Flow"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </DashboardCard>
  );
});
