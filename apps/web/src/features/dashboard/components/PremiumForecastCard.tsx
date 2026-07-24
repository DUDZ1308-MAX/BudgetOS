import { motion } from 'framer-motion';

interface PremiumForecastCardProps {
  title: string;
  periods: Array<{ label: string; value: number; format?: 'currency' | 'number' | 'months' }>;
  projectedDate?: string | null;
  projectedLabel?: string;
  accentColor?: string;
  icon?: string;
  isLoading?: boolean;
}

function formatVal(value: number, format?: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'months') {
    return `${value} mo`;
  }
  return value.toLocaleString();
}

export function PremiumForecastCard({ title, periods, projectedDate, projectedLabel, accentColor, icon, isLoading }: PremiumForecastCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-3 w-full animate-pulse rounded bg-gray-200" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-xl border p-4 flex flex-col"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>

      <div className="flex-1 space-y-2">
        {periods.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
            <span className="font-medium" style={{ color: p.value < 0 ? 'var(--danger)' : (accentColor ?? 'var(--text-primary)') }}>
              {formatVal(p.value, p.format)}
            </span>
          </div>
        ))}
      </div>

      {projectedDate && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>{projectedLabel ?? 'Projected'}</span>
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{projectedDate}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
