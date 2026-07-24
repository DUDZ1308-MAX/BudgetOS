import type { ReportInsight } from '../reportTypes';

const ICONS: Record<string, string> = {
  positive: '✓',
  neutral: 'i',
  warning: '!',
};
const STYLES: Record<string, { border: string; bg: string; iconBg: string; iconColor: string }> = {
  positive: {
    border: 'border-emerald-200 dark:border-emerald-900',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  neutral: {
    border: 'border-blue-200 dark:border-blue-900',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
};

export function ReportInsightsPanel({ insights }: { insights: ReportInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Report Insights</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, i) => {
          const s = STYLES[insight.type] ?? STYLES.neutral;
          return (
            <div key={i} className={`rounded-xl border p-4 ${s!.border} ${s!.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${s!.iconBg} ${s!.iconColor}`}>
                  {ICONS[insight.type] ?? 'i'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
