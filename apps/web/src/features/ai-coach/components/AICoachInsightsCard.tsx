import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { getCoachInsights } from '@/services/ai/coach/service';
import type { CoachInsight } from '@/services/ai/coach/types';
import { ClickableCard } from '@/components/dashboard/ClickableCard';

const severityStyle: Record<CoachInsight['severity'], { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--status-error, #f87171)', bg: 'rgba(248, 113, 113, 0.08)', label: 'Critical' },
  warning: { color: 'var(--status-warning, #fbbf24)', bg: 'rgba(251, 191, 36, 0.08)', label: 'Warning' },
  info: { color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', label: 'Info' },
  positive: { color: 'var(--status-success, #34d399)', bg: 'rgba(52, 211, 153, 0.08)', label: 'Positive' },
};

const categoryColors: Record<string, string> = {
  spending: 'bg-blue-500/10 text-blue-400',
  budget: 'bg-yellow-500/10 text-yellow-400',
  cashflow: 'bg-purple-500/10 text-purple-400',
  savings: 'bg-emerald-500/10 text-emerald-400',
  mortgage: 'bg-cyan-500/10 text-cyan-400',
  health: 'bg-violet-500/10 text-violet-400',
  forecast: 'bg-rose-500/10 text-rose-400',
};

export function AICoachInsightsCard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['coach-insights', user?.id],
    queryFn: () => getCoachInsights(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const list = insights ?? [];

  return (
    <ClickableCard href="/ai" ariaLabel="View AI Financial Coach">
      <div className="premium-card p-3.5 sm:p-4 lg:p-5 flex flex-col min-h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Financial Coach
          </h3>
          <span className="text-sm">{'\u2728'}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-700/40" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="text-2xl">{'\uD83D\uDC4D'}</div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Your finances look steady. Ask your AI Financial Coach anything about spending, budgets, savings, or mortgages.
            </p>
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {list.map((insight) => {
              const style = severityStyle[insight.severity];
              return (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: style.bg, border: '1px solid var(--border-default)' }}
                >
                  <span
                    className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: style.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {insight.title}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${categoryColors[insight.category] ?? 'bg-gray-500/10 text-gray-400'}`}>
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/ai')}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          style={{ color: 'var(--text-primary)' }}
        >
          View in AI Coach &rarr;
        </button>
      </div>
    </ClickableCard>
  );
}
