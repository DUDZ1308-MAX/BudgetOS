import { memo, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface DataPoint {
  name: string;
  value: number;
  percent?: number;
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
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
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
      <DashboardCard title={title}>
        <div className="flex items-center gap-6">
          <div className="h-48 w-48 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title={title}>
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No spending data.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={title}>
      <div className="flex items-center gap-6">
        <div className="h-[200px] w-[200px] shrink-0" aria-label={`${title} donut chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                animationDuration={800}
              >
                {displayData.map((d, index) => (
                  <Cell
                    key={d.name}
                    fill={COLORS[d.colorIdx % COLORS.length]}
                    opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.5}
                    className="cursor-pointer transition-opacity duration-200"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 flex-1 space-y-2" role="list" aria-label="Category breakdown">
          {displayData.map((d, i) => (
            <div
              key={d.name}
              className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                activeIndex === i ? 'bg-slate-50 dark:bg-slate-800/50' : ''
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
              role="listitem"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[d.colorIdx % COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(d.value)}
              </span>
              <span className="shrink-0 text-[10px] text-slate-400 tabular-nums">
                {d.percent !== undefined ? `${(d.percent * 100).toFixed(1)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
});
