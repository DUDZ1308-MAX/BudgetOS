import type { KpiMetric } from '../reportTypes';

export function ReportMetricsRow({ metrics }: { metrics: KpiMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border p-3 sm:p-4"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: m.color ?? 'var(--text-primary)' }}>{m.value}</p>
          {m.change && (
            <p className={`mt-0.5 text-xs ${m.change.positive ? 'text-emerald-500' : 'text-red-500'}`}>
              {m.change.positive ? '↑' : '↓'} {m.change.value}
              {m.change.label && <span className="text-gray-400 ml-1">{m.change.label}</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
