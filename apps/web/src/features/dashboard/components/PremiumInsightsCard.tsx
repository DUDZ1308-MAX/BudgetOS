interface Insight {
  id: string;
  category: string;
  title: string;
  message: string;
  type: string;
  date: string;
}

interface Props {
  insights: Insight[];
  isLoading?: boolean;
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'positive') return <span className="text-emerald-500 text-lg">✓</span>;
  if (type === 'warning') return <span className="text-amber-500 text-lg">!</span>;
  return <span className="text-gray-400 text-lg">i</span>;
}

const categoryColors: Record<string, string> = {
  spending: 'bg-blue-500/10 text-blue-400',
  savings: 'bg-emerald-500/10 text-emerald-400',
  debt: 'bg-red-500/10 text-red-400',
  cash_flow: 'bg-purple-500/10 text-purple-400',
  budget: 'bg-yellow-500/10 text-yellow-400',
  mortgage: 'bg-cyan-500/10 text-cyan-400',
  net_worth: 'bg-violet-500/10 text-violet-400',
};

export function PremiumInsightsCard({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-4 w-24 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="premium-card p-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Intelligent Insights
      </h3>

      <div className="space-y-2">
        {insights.slice(0, 5).map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <div className="mt-0.5">
              <TypeIcon type={insight.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {insight.title}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${categoryColors[insight.category] ?? 'bg-gray-500/10 text-gray-400'}`}>
                  {insight.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {insight.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
