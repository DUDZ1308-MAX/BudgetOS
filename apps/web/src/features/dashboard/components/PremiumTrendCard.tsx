import { motion } from 'framer-motion';
import { ClickableCard } from '@/components/dashboard/ClickableCard';

interface TrendItem {
  direction: string;
  change: number;
  changePercent: number;
}

interface Props {
  title: string;
  trend: TrendItem;
  format?: 'currency' | 'percent' | 'number';
  isLoading?: boolean;
  href?: string;
}

function TrendArrow({ direction }: { direction: string }) {
  if (direction === 'improving') return <span className="text-emerald-500">↑</span>;
  if (direction === 'declining') return <span className="text-red-500">↓</span>;
  return <span className="text-gray-400">→</span>;
}

function TrendColor({ direction }: { direction: string }) {
  if (direction === 'improving') return 'var(--color-success)';
  if (direction === 'declining') return 'var(--color-danger)';
  return 'var(--text-muted)';
}

export function PremiumTrendCard({ title, trend, format = 'currency', isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-3 w-24 bg-gray-700 rounded mb-3" />
        <div className="h-6 w-20 bg-gray-700 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-700 rounded" />
      </div>
    );
  }

  const formatValue = (val: number): string => {
    if (format === 'currency') return `$${Math.abs(val).toLocaleString()}`;
    if (format === 'percent') return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}`;
  };

  return (
    <ClickableCard href={href} ariaLabel={`View ${title} trend details`}>
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {title}
          </h4>
          <motion.span
            className="text-lg font-bold"
            style={{ color: TrendColor({ direction: trend.direction }) }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <TrendArrow direction={trend.direction as string} />
          </motion.span>
        </div>
        <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatValue(trend.change)}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            trend.direction === 'improving' ? 'bg-emerald-500/10 text-emerald-500' :
            trend.direction === 'declining' ? 'bg-red-500/10 text-red-500' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {trend.direction === 'improving' ? 'Improving' : trend.direction === 'declining' ? 'Declining' : 'Stable'}
          </span>
          <span>{format === 'percent' ? `${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%` : ''}</span>
        </div>
      </div>
    </ClickableCard>
  );
}
