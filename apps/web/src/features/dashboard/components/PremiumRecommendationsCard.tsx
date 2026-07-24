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
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[priority] ?? 'bg-gray-500/10 text-gray-400'}`}>
      {priority}
    </span>
  );
}

export function PremiumRecommendationsCard({ recommendations, isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
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
        <div className="premium-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Recommendations
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Great job! Your financial health is in good shape. No recommendations at this time.
          </p>
        </div>
      </ClickableCard>
    );
  }

  return (
    <ClickableCard href={href} ariaLabel="View financial recommendations">
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recommendations
          </h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {recommendations.length} action{recommendations.length !== 1 ? 's' : ''} needed
          </span>
        </div>

        <div className="space-y-2">
          {recommendations.slice(0, 4).map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {rec.title}
                </span>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {rec.description}
              </p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                {rec.estimatedSavings > 0 && (
                  <span>Save ${rec.estimatedSavings.toLocaleString()}/mo</span>
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
