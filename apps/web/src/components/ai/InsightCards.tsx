import type { EnhancedInsight } from '@/ai/InsightEngine';

interface InsightCardsProps {
  insights: EnhancedInsight[];
}

const typeStyles = {
  critical: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950',
};

const typeIcons = {
  critical: '!',
  warning: '!',
  info: 'i',
  success: '✓',
};

export function InsightCards({ insights }: InsightCardsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Insights</h3>
      <div className="space-y-2">
        {insights.slice(0, 5).map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border p-3 ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {typeIcons[insight.type]}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{insight.title}</p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{insight.message}</p>
                {insight.suggestion && (
                  <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">{insight.suggestion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
