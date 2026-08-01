import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAiCoach } from '../hooks/useAiCoach';
import { ClickableCard } from '@/components/dashboard/ClickableCard';

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--status-success, #34d399)';
  if (score >= 60) return 'var(--status-warning, #fbbf24)';
  if (score >= 40) return '#f97316';
  return 'var(--status-error, #f87171)';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'var(--status-error, #f87171)';
    case 'high': return '#f97316';
    case 'medium': return 'var(--status-warning, #fbbf24)';
    case 'low': return 'var(--status-success, #34d399)';
    default: return 'var(--text-muted)';
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'positive': return '\u2705';
    case 'negative': return '\u26A0\uFE0F';
    case 'critical': return '\uD83D\uDEA8';
    default: return '\u2139\uFE0F';
  }
}

export function AiCoachCard() {
  const navigate = useNavigate();
  const coach = useAiCoach();

  if (coach.isLoading) {
    return (
      <div className="premium-card p-4 animate-pulse sm:p-5 lg:p-6">
        <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (coach.error) {
    return (
      <div className="premium-card p-4 sm:p-5 lg:p-6" style={{ borderLeft: '3px solid var(--status-error, #f87171)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          AI Financial Coach
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{coach.error}</p>
      </div>
    );
  }

  const { summary, topInsight, topRecommendation, topWarning, topAchievement } = coach;

  return (
    <ClickableCard href="/ai-coach" ariaLabel="View AI Financial Coach">
      <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            AI Financial Coach
          </h3>
          {summary && (
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: getScoreColor(summary.healthScore) }}
              />
              <span className="text-xs font-bold tabular-nums" style={{ color: getScoreColor(summary.healthScore) }}>
                {summary.healthScore}
              </span>
            </div>
          )}
        </div>

        {/* Health Score Mini */}
        {summary && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div className="relative">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bg-elevated, #334155)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke={getScoreColor(summary.healthScore)}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 - (summary.healthScore / 100) * 2 * Math.PI * 20}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: getScoreColor(summary.healthScore) }}
              >
                {summary.healthScore}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {summary.healthGrade ? `Grade ${summary.healthGrade}` : 'Health Score'}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {summary.monthlyIncome > 0 ? `${((summary.cashFlow / summary.monthlyIncome) * 100).toFixed(0)}% savings rate` : 'Building profile'}
              </div>
            </div>
          </div>
        )}

        {/* Top Insight */}
        {topInsight && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5 shrink-0">{getSeverityIcon(topInsight.severity)}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {topInsight.title}
                </div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {topInsight.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Recommendation */}
        {topRecommendation && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-start gap-2">
              <div
                className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                style={{ background: getPriorityColor(topRecommendation.priority) }}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {topRecommendation.title}
                </div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {topRecommendation.estimatedImpact}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning or Achievement */}
        {topWarning ? (
          <div className="mb-3 p-3 rounded-lg border" style={{ borderColor: 'rgba(248, 113, 113, 0.3)', background: 'rgba(248, 113, 113, 0.05)' }}>
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5 shrink-0">{'\uD83D\uDEA8'}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--status-error, #f87171)' }}>
                  {topWarning.title}
                </div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {topWarning.message}
                </div>
              </div>
            </div>
          </div>
        ) : topAchievement ? (
          <div className="mb-3 p-3 rounded-lg border" style={{ borderColor: 'rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.05)' }}>
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5 shrink-0">{'\uD83C\uDFC6'}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--status-success, #34d399)' }}>
                  {topAchievement.title}
                </div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {topAchievement.description}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Stats */}
        {summary && (
          <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div className="min-w-0 text-center">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Cash Flow</div>
              <div className="truncate text-xs font-bold tabular-nums" style={{ color: summary.cashFlow >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                {fmt(summary.cashFlow)}
              </div>
            </div>
            <div className="min-w-0 text-center">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Goals</div>
              <div className="truncate text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {summary.activeGoals}
              </div>
            </div>
            <div className="min-w-0 text-center">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Alerts</div>
              <div className="truncate text-xs font-bold tabular-nums" style={{ color: coach.warnings.length > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                {coach.warnings.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClickableCard>
  );
}
