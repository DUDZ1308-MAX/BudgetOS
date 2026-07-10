import type { Recommendation } from '@/ai/types';

interface RecommendationCardsProps {
  recommendations: Recommendation[];
}

const priorityColors = {
  critical: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
  high: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
  medium: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
  low: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800',
};

const priorityBadge = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recommendations</h3>
      <div className="space-y-2">
        {recommendations.slice(0, 5).map((rec) => (
          <div
            key={rec.id}
            className={`rounded-xl border p-3 ${priorityColors[rec.priority]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityBadge[rec.priority]}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{rec.description}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Impact: {rec.impact}</span>
                  <span>Confidence: {rec.confidence}%</span>
                </div>
                <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{rec.reasoning}</p>
              </div>
              <div className="shrink-0">
                {rec.actionLabel && (
                  <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                    {rec.actionLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
