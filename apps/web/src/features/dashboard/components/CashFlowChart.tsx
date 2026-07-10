import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '@/stores/auth';
import { transactionsApi } from '@/lib/api/transactions';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency } from '@/services/transactionService';

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.fill }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export const CashFlowChart = memo(function CashFlowChart() {
  const user = useAuthStore((s) => s.user);

  const { data: allTxns, isLoading } = useQuery({
    queryKey: ['transactions-all', user?.id],
    queryFn: () => transactionsApi.list(user!.id),
    enabled: !!user,
  });

  const chartData = useMemo(() => {
    if (!allTxns) return null;
    const range = currentMonthRange();
    const monthTxns = allTxns.filter((t) => t.date >= range.start && t.date <= range.end);
    const weekBuckets: Record<string, { income: number; expenses: number }> = {};
    for (let w = 0; w < 5; w++) weekBuckets[`W${w + 1}`] = { income: 0, expenses: 0 };

    for (const t of monthTxns) {
      const day = new Date(t.date).getDate();
      const weekNum = Math.min(Math.floor((day - 1) / 7), 4);
      const key = `W${weekNum + 1}`;
      const amount = Number(t.amount ?? 0);
      const bucket = weekBuckets[key]!;
      if (amount >= 0) bucket.income += amount;
      else bucket.expenses += Math.abs(amount);
    }

    return Object.entries(weekBuckets).map(([week, vals]) => ({
      week,
      Income: Math.round(vals.income),
      Expenses: Math.round(vals.expenses),
    }));
  }, [allTxns]);

  if (isLoading) {
    return (
      <DashboardCard title="Cash Flow Trend" subtitle="Weekly income vs expenses">
        <SkeletonLoader lines={4} className="h-44" />
      </DashboardCard>
    );
  }

  if (!chartData) {
    return (
      <DashboardCard title="Cash Flow Trend" subtitle="Weekly income vs expenses">
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No transaction data available.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Cash Flow Trend" subtitle="Weekly income vs expenses">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend iconType="circle" formatter={(value: string) => <span className="text-xs text-slate-500">{value}</span>} />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
});
