import { useMemo } from 'react';
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

function getTrendColor(direction: string): string {
  if (direction === 'improving') return 'var(--status-success, #34d399)';
  if (direction === 'declining') return 'var(--status-error, #f87171)';
  return 'var(--text-muted)';
}

function MiniSparkline({ direction }: { direction: string }) {
  const points = useMemo(() => {
    const baseline = [42, 45, 43, 48, 46, 52, 50, 55, 58, 62, 60, 65];
    if (direction === 'declining') {
      return baseline.map((v, i) => 80 - v + i * 1.5);
    }
    if (direction === 'stable') {
      return baseline.map(() => 50 + (Math.random() * 6 - 3));
    }
    return baseline;
  }, [direction]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const padding = 2;

  const pathPoints = points.map((v, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const color = getTrendColor(direction);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-60">
      <defs>
        <linearGradient id={`sparkline-${direction}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${pathPoints.join(' ')} ${width - padding},${height - padding}`}
        fill={`url(#sparkline-${direction})`}
      />
      {/* Line */}
      <polyline
        points={pathPoints.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {pathPoints.length > 0 && (() => {
        const lastPoint = pathPoints[pathPoints.length - 1]!;
        const [ex, ey] = lastPoint.split(',');
        return (
          <circle
            cx={parseFloat(ex ?? '0')}
            cy={parseFloat(ey ?? '0')}
            r="3"
            fill={color}
          />
        );
      })()}
    </svg>
  );
}

export function PremiumTrendCard({ title, trend, format = 'currency', isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-3.5 animate-pulse sm:p-4 lg:p-5">
        <div className="h-3 w-24 bg-gray-700 rounded mb-3" />
        <div className="h-8 w-20 bg-gray-700 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-700 rounded" />
      </div>
    );
  }

  const formatValue = (val: number): string => {
    if (format === 'currency') return `$${Math.abs(val).toLocaleString()}`;
    if (format === 'percent') return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}`;
  };

  const color = getTrendColor(trend.direction);
  const isPositive = trend.direction === 'improving';
  const isNegative = trend.direction === 'declining';

  return (
    <ClickableCard href={href} ariaLabel={`View ${title} trend details`}>
      <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {title}
          </h4>
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-base font-bold" style={{ color }}>
              {isPositive ? '↑' : isNegative ? '↓' : '→'}
            </span>
          </motion.div>
        </div>

        {/* Sparkline */}
        <div className="mb-4">
          <MiniSparkline direction={trend.direction} />
        </div>

        {/* Main Value */}
        <div className="mb-3">
          <div className="text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            {formatValue(trend.change)}
          </div>
        </div>

        {/* Trend Badge + Change */}
        <div className="flex items-center gap-2 mt-auto">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-500' :
            isNegative ? 'bg-red-500/10 text-red-500' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {isPositive ? 'Improving' : isNegative ? 'Declining' : 'Stable'}
          </span>
          {format === 'percent' && (
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {trend.changePercent >= 0 ? '+' : ''}{trend.changePercent.toFixed(1)}% change
            </span>
          )}
        </div>
      </div>
    </ClickableCard>
  );
}
