import { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { AmortizationRow } from '@/lib/finance';

interface Props {
  schedule: AmortizationRow[];
  monthlyPayment: number;
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-800" role="tooltip">
      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-white">Month {row.month}</p>
      <div className="space-y-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">Payment: {formatCurrency(row.payment)}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Principal: {formatCurrency(row.principal)}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">Interest: {formatCurrency(row.interest)}</p>
        <p className="text-xs font-medium text-slate-700 dark:text-white">Balance: {formatCurrency(row.remainingBalance)}</p>
      </div>
    </div>
  );
}

export const MortgagePayoffTimeline = memo(function MortgagePayoffTimeline({ schedule, monthlyPayment, isLoading }: Props) {
  const chartData = useMemo(() => {
    if (!schedule.length) return [];
    return schedule
      .filter((_, i) => i % 3 === 0 || i === schedule.length - 1)
      .map((r) => ({
        ...r,
        label: `Y${Math.floor(r.month / 12) + 1}`,
        principalPct: r.payment > 0 ? (r.principal / r.payment) * 100 : 0,
        interestPct: r.payment > 0 ? (r.interest / r.payment) * 100 : 0,
      }));
  }, [schedule]);

  const totalMonths = schedule.length;
  const totalYears = Math.ceil(totalMonths / 12);
  const midpoint = Math.floor(schedule.length / 2);
  const midpointRow = schedule[midpoint];

  if (isLoading) {
    return (
      <DashboardCard title="Payoff Timeline">
        <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </DashboardCard>
    );
  }

  if (schedule.length === 0) {
    return (
      <DashboardCard title="Payoff Timeline">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No amortization schedule.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Payoff Timeline"
      subtitle={`${totalYears} year${totalYears !== 1 ? 's' : ''} · ${formatCurrency(monthlyPayment)}/mo`}
    >
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Principal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Interest</span>
        </div>
      </div>

      <div className="h-64" aria-label="Mortgage payoff timeline chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="principalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="interestAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            {midpointRow && (
              <ReferenceLine
                x={`Y${Math.floor(midpointRow.month / 12) + 1}`}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: 'Midpoint', fontSize: 10, fill: '#6366f1' }}
              />
            )}
            <Area type="monotone" dataKey="principal" stackId="1" stroke="#10b981" fill="url(#principalAreaGrad)" strokeWidth={2} animationDuration={1000} />
            <Area type="monotone" dataKey="interest" stackId="1" stroke="#f59e0b" fill="url(#interestAreaGrad)" strokeWidth={2} animationDuration={1000} animationBegin={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
});
