import type { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  change?: { value: string; positive: boolean };
  icon: string;
  children?: ReactNode;
}

export function DashboardCard({ title, value, change, icon, children }: DashboardCardProps) {
  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      {change && (
        <div className={`text-sm mt-1 ${change.positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {change.positive ? '↑' : '↓'} {change.value}
        </div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}