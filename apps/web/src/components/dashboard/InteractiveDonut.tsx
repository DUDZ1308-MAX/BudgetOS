import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface DataPoint {
  name: string;
  value: number;
  percent?: number;
  icon?: string;
}

interface Props {
  data: DataPoint[];
  title?: string;
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

function renderActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, value, percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize={16} fontWeight={700}>
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-400" fontSize={11}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
}

export const InteractiveDonut = memo(function InteractiveDonut({ data, title = 'Spending Breakdown', isLoading }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const displayData = useMemo(
    () => data.map((d, i) => ({ ...d, percent: total > 0 ? d.value / total : 0, colorIdx: i })),
    [data, total],
  );

  if (isLoading) {
    return (
      <DashboardCard title={title} delay={0.2}>
        <div className="flex items-center gap-6">
          <div className="h-48 w-48 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title={title} delay={0.2}>
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No spending data.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={title} delay={0.2}>
      <div className="flex items-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-[200px] w-[200px] shrink-0 chart-depth-lg"
          aria-label={`${title} donut chart`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="donutShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                </filter>
              </defs>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                animationDuration={1000}
                animationBegin={200}
              >
                {displayData.map((d, index) => (
                  <Cell
                    key={d.name}
                    fill={COLORS[d.colorIdx % COLORS.length]}
                    opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.4}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    filter={activeIndex === index ? 'url(#donutShadow)' : undefined}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="min-w-0 flex-1 space-y-2" role="list" aria-label="Category breakdown">
          {displayData.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200 ${
                activeIndex === i ? 'scale-[1.02]' : ''
              }`}
              style={{
                background: activeIndex === i ? 'var(--bg-elevated)' : 'transparent',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
              role="listitem"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: COLORS[d.colorIdx % COLORS.length],
                  boxShadow: activeIndex === i ? `0 0 8px ${COLORS[d.colorIdx % COLORS.length]}` : 'none',
                }}
              />
              <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(d.value)}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {d.percent !== undefined ? `${(d.percent * 100).toFixed(1)}%` : ''}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
});
