import { ClickableCard } from '@/components/dashboard/ClickableCard';

interface Recommendation {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  estimatedSavings: number;
  estimatedTimeline: string;
}

interface Props {
  recommendations: Recommendation[];
  isLoading?: boolean;
  href?: string;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500',
    high: 'bg-orange-500/10 text-orange-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    low: 'bg-blue-500/10 text-blue-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[priority] ?? 'bg-gray-500/10 text-gray-400'}`}>
      {priority}
    </span>
  );
}

export function PremiumRecommendationsCard({ recommendations, isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-3.5 animate-pulse sm:p-4 lg:p-5">
        <div className="h-4 w-36 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <ClickableCard href={href} ariaLabel="View recommendations">
        <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Recommendations
          </h3>
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Looking good!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                No recommendations at this time.
              </p>
            </div>
          </div>
        </div>
      </ClickableCard>
    );
  }

  return (
    <ClickableCard href={href} ariaLabel="View financial recommendations">
      <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Recommendations
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
            {recommendations.length}
          </span>
        </div>

        <div className="space-y-2.5 flex-1">
          {recommendations.slice(0, 4).map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  {rec.title}
                </span>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                {rec.description}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {rec.estimatedSavings > 0 && (
                  <span className="flex items-center gap-1">
                    <span style={{ color: 'var(--status-success)' }}>$</span>
                    {rec.estimatedSavings.toLocaleString()}/mo
                  </span>
                )}
                <span>{rec.estimatedTimeline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClickableCard>
  );
}
