import { memo, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useForecastData } from '@/features/calendar/useForecastData';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { ForecastWindow } from '@/lib/forecast/types';

function formatCurrency(n: number): string {
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const WINDOWS: ForecastWindow[] = [30, 60, 90];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]!.value;
  return (
    <div className="rounded-lg border px-2 py-1.5 text-xs shadow-lg" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
      <p className="opacity-70 mb-0.5">{label}</p>
      <p className="font-bold" style={{ color: value < 0 ? 'var(--status-error)' : 'var(--status-success)' }}>{formatCurrency(value)}</p>
    </div>
  );
}

export const CashFlowForecastCard = memo(function CashFlowForecastCard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useForecastData(user?.id);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.daily.slice(0, 30).map((point) => ({
      date: new Date(point.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: Math.round(point.balance),
    }));
  }, [data]);

  const criticalWarning = data?.warnings.find((w) => w.severity === 'critical');

  return (
    <DashboardCard
      title="Cash Flow Forecast"
      subtitle="Projected next 90 days"
      action={
        <button
          onClick={() => navigate('/calendar')}
          className="text-xs font-medium rounded-md px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: 'var(--accent-primary)' }}
        >
          Open calendar
        </button>
      }
    >
      {isLoading || !data ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {criticalWarning && (
            <div className="mb-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--status-error)', background: 'color-mix(in srgb, var(--status-error) 12%, transparent)', color: 'var(--status-error)' }}>
              <span className="font-semibold">{criticalWarning.title}.</span> {criticalWarning.message}
            </div>
          )}
          <div className="h-24 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashCashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
                <Area type="monotone" dataKey="balance" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#dashCashFlowGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {WINDOWS.map((w) => {
              const r = data.ranges[w];
              if (!r) return null;
              return (
                <div key={w} className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{w}d ending</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: r.endingBalance < 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
                    {formatCurrency(r.endingBalance)}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: r.lowestBalance < 0 ? 'var(--status-error)' : 'var(--text-muted)' }}>
                    low {formatCurrency(r.lowestBalance)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardCard>
  );
});
