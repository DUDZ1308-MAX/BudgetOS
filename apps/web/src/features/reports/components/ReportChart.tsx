import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { ChartConfig } from '../reportTypes';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function TooltipCard({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

const renderLegend = (v: string) => <span className="text-xs text-slate-500">{v}</span>;

export function ReportChart({ config }: { config: ChartConfig }) {
  const { title, type, data, series, xKey, height = 280 } = config;

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={Math.min(height, 300)}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey={xKey} cx="50%" cy="50%" outerRadius={70} innerRadius={35} label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}>
                {data.map((_entry: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<TooltipCard />} />
              <Legend formatter={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCard />} />
              <Legend formatter={renderLegend} iconType="circle" />
              {series.map((s) => (
                <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color} fill={s.color} fillOpacity={0.1} strokeWidth={2} dot={false} name={s.name} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'stacked':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCard />} />
              <Legend formatter={renderLegend} iconType="circle" />
              {series.map((s, i) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} stackId="stack" fill={s.color || COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} name={s.name} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCard />} />
              <Legend formatter={renderLegend} iconType="circle" />
              {series.length > 1 ? series.map((s, i) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} name={s.name} />
              )) : (
                <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]}>
                  {data.map((_entry: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  }, [data, type, series, xKey, height]);

  return (
    <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
      <h3 className="mb-3 text-xs font-semibold sm:text-sm sm:mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No data available for this period.</p>
      ) : chart}
    </div>
  );
}
