import { ClickableCard } from '@/components/dashboard/ClickableCard';
import { COACH_QUESTIONS } from '../coachTypes';
import type { CoachSummary, CoachQuestion } from '../coachTypes';

interface Props {
  summary: CoachSummary | null;
  isLoading?: boolean;
  onQuestionClick?: (question: CoachQuestion) => void;
  href?: string;
}

function statusColor(health: CoachSummary['budgetHealth']): string {
  switch (health) {
    case 'good': return 'var(--status-success)';
    case 'fair': return 'var(--status-warning)';
    case 'poor': return 'var(--status-error)';
  }
}

function savingsRateColor(rate: number): string {
  if (rate >= 20) return 'var(--status-success)';
  if (rate >= 10) return 'var(--status-warning)';
  return 'var(--status-error)';
}

export function CoachDashboardCard({ summary, isLoading, onQuestionClick, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <ClickableCard href={href} ariaLabel="Open AI Financial Coach">
      <div className="premium-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Financial Coach</h3>
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            AI Powered
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2 dark:bg-black/10">
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Income</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${summary.totalIncome.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 dark:bg-black/10">
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Expenses</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${summary.totalExpenses.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 dark:bg-black/10">
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Net Worth</div>
            <div className="text-sm font-bold" style={{ color: summary.netWorth >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
              ${summary.netWorth.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 dark:bg-black/10">
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Savings Rate</div>
            <div className="text-sm font-bold" style={{ color: savingsRateColor(summary.savingsRate) }}>
              {summary.savingsRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(summary.budgetHealth) }} />
            {summary.budgetHealth === 'good' ? 'Healthy' : summary.budgetHealth === 'fair' ? 'Fair' : 'Needs attention'}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span style={{ color: 'var(--text-tertiary)' }}>{summary.activeGoals} active goal{summary.activeGoals !== 1 ? 's' : ''}</span>
          {summary.recommendationCount > 0 && (
            <>
              <span style={{ color: 'var(--text-tertiary)' }}>·</span>
              <span style={{ color: 'var(--status-warning)' }}>{summary.recommendationCount} recommendation{summary.recommendationCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COACH_QUESTIONS.slice(0, 4).map((q) => (
            <button
              key={q.id}
              onClick={(e) => { e.stopPropagation(); onQuestionClick?.(q); }}
              className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/10 dark:bg-black/10 dark:hover:bg-black/20"
              style={{ color: 'var(--text-secondary)' }}
            >
              {q.icon} {q.label}
            </button>
          ))}
        </div>

        <div className="mt-2 text-right text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
          Updated {new Date(summary.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </ClickableCard>
  );
}
