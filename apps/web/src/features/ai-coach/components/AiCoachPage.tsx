import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAiCoach } from '../hooks/useAiCoach';
import type { FilterPriority, AiRecommendation, AiInsight, AiWarning, AiAchievement } from '../types';

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
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

function getPriorityBg(priority: string): string {
  switch (priority) {
    case 'critical': return 'rgba(248, 113, 113, 0.1)';
    case 'high': return 'rgba(249, 115, 22, 0.1)';
    case 'medium': return 'rgba(251, 191, 36, 0.1)';
    case 'low': return 'rgba(52, 211, 153, 0.1)';
    default: return 'var(--bg-elevated)';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'positive': return 'var(--status-success, #34d399)';
    case 'negative': return 'var(--status-error, #f87171)';
    case 'critical': return 'var(--status-error, #f87171)';
    default: return 'var(--text-muted)';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--status-success, #34d399)';
  if (score >= 60) return 'var(--status-warning, #fbbf24)';
  if (score >= 40) return '#f97316';
  return 'var(--status-error, #f87171)';
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const section = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const PRIORITY_FILTERS: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'completed', label: 'Completed' },
];

function RecommendationCard({ rec }: { rec: AiRecommendation }) {
  return (
    <motion.div
      variants={section}
      className="p-4 rounded-xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-2 w-2 rounded-full mt-1.5 shrink-0"
          style={{ background: getPriorityColor(rec.priority) }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {rec.title}
            </h4>
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ color: getPriorityColor(rec.priority), background: getPriorityBg(rec.priority) }}
            >
              {rec.priority}
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            {rec.description}
          </p>
          <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>Impact: {rec.estimatedImpact}</span>
            <span>Confidence: {rec.confidence}%</span>
          </div>
          {rec.supportingData && (
            <div className="mt-2 text-[11px] p-2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {rec.supportingData}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  return (
    <div
      className="p-3 rounded-lg border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start gap-2">
        <div
          className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
          style={{ background: getSeverityColor(insight.severity) }}
        />
        <div className="min-w-0">
          <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {insight.title}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {insight.description}
          </div>
          {insight.value && (
            <div className="text-[11px] mt-1 font-medium" style={{ color: getSeverityColor(insight.severity) }}>
              {insight.metric}: {insight.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: AiWarning }) {
  return (
    <div
      className="p-3 rounded-lg border"
      style={{
        background: warning.severity === 'critical' ? 'rgba(248, 113, 113, 0.05)' : 'var(--bg-card)',
        borderColor: warning.severity === 'critical' ? 'rgba(248, 113, 113, 0.3)' : 'var(--border-default)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5 shrink-0">
          {warning.severity === 'critical' ? '\uD83D\uDEA8' : '\u26A0\uFE0F'}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold mb-0.5" style={{ color: getPriorityColor(warning.severity) }}>
            {warning.title}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {warning.message}
          </div>
          {warning.suggestedAction && (
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {warning.suggestedAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AiAchievement }) {
  return (
    <div
      className="p-3 rounded-lg border"
      style={{ borderColor: 'rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.05)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5 shrink-0">{'\uD83C\uDFC6'}</span>
        <div className="min-w-0">
          <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--status-success, #34d399)' }}>
            {achievement.title}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {achievement.description}
          </div>
          {achievement.value && (
            <div className="text-[11px] mt-1 font-medium" style={{ color: 'var(--status-success)' }}>
              {achievement.metric}: {achievement.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CashFlowBar({ month, projected, trend }: { month: string; projected: number; trend: string }) {
  const maxAbs = 10000;
  const width = Math.min(Math.abs(projected) / maxAbs * 100, 100);
  const color = trend === 'positive' ? 'var(--status-success)' : trend === 'negative' ? 'var(--status-error)' : 'var(--text-muted)';

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-16 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{month}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, width: `${Math.max(width, 2)}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(width, 2)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="w-20 text-right tabular-nums font-medium" style={{ color }}>
        {fmt(projected)}
      </span>
    </div>
  );
}

export function AiCoachPage() {
  const navigate = useNavigate();
  const coach = useAiCoach();
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  const filteredRecs = coach.getFilteredRecommendations(priorityFilter);

  if (coach.isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">AI Financial Coach</h1>
          <p className="page-subtitle">Loading your financial analysis...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card p-4 animate-pulse">
              <div className="h-4 w-32 bg-gray-700 rounded mb-3" />
              <div className="h-3 w-full bg-gray-700 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="page-container"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={section} className="page-header">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="page-title">AI Financial Coach</h1>
            <p className="page-subtitle">Intelligent analysis of your financial health</p>
          </div>
        </div>
      </motion.div>

      {/* Financial Summary */}
      {coach.summary && (
        <motion.div variants={section}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="premium-card p-4">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Health Score</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(coach.summary.healthScore) }}>
                  {coach.summary.healthScore}
                </span>
                {coach.summary.healthGrade && (
                  <span className="text-sm font-bold" style={{ color: getScoreColor(coach.summary.healthScore) }}>
                    {coach.summary.healthGrade}
                  </span>
                )}
              </div>
            </div>
            <div className="premium-card p-4">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Cash Flow</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: coach.summary.cashFlow >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                {fmt(coach.summary.cashFlow)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {pct(coach.summary.savingsRate)} savings rate
              </div>
            </div>
            <div className="premium-card p-4">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Net Worth</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: coach.summary.netWorth >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                {fmt(coach.summary.netWorth)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {fmt(coach.summary.totalAssets)} assets
              </div>
            </div>
            <div className="premium-card p-4">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Budget Usage</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: coach.summary.budgetUtilization > 100 ? 'var(--status-error)' : 'var(--text-primary)' }}>
                {pct(coach.summary.budgetUtilization)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {coach.summary.activeGoals} active goals
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Warnings */}
      {coach.warnings.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--status-error, #f87171)' }}>
            Warnings ({coach.warnings.length})
          </h2>
          <div className="space-y-2">
            {coach.warnings.map((w) => (
              <WarningCard key={w.id} warning={w} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {coach.achievements.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--status-success, #34d399)' }}>
            Achievements ({coach.achievements.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coach.achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations with Priority Filter */}
      <motion.div variants={section}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recommendations ({filteredRecs.length})
          </h2>
          <div className="flex gap-1 flex-wrap">
            {PRIORITY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setPriorityFilter(f.value)}
                className="text-[11px] font-medium px-2 py-1 rounded transition-colors"
                style={{
                  background: priorityFilter === f.value ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: priorityFilter === f.value ? 'white' : 'var(--text-secondary)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredRecs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
          {filteredRecs.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              No recommendations match this filter.
            </div>
          )}
        </div>
      </motion.div>

      {/* Insights */}
      {coach.insights.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Insights ({coach.insights.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coach.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Savings & Debt Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {coach.savingsOpportunities.length > 0 && (
          <motion.div variants={section}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--status-success, #34d399)' }}>
              Savings Opportunities
            </h2>
            <div className="space-y-3">
              {coach.savingsOpportunities.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          </motion.div>
        )}

        {coach.debtOpportunities.length > 0 && (
          <motion.div variants={section}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#f97316' }}>
              Debt Opportunities
            </h2>
            <div className="space-y-3">
              {coach.debtOpportunities.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Budget Optimizations */}
      {coach.budgetOptimizations.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--status-warning, #fbbf24)' }}>
            Budget Optimization
          </h2>
          <div className="space-y-3">
            {coach.budgetOptimizations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Cash Flow Forecast */}
      {coach.cashFlowForecast.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Cash Flow Forecast
          </h2>
          <div className="premium-card p-4 space-y-2">
            {coach.cashFlowForecast.map((cf) => (
              <CashFlowBar key={cf.month} {...cf} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Trends */}
      {coach.recentTrends.length > 0 && (
        <motion.div variants={section}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Recent Trends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coach.recentTrends.map((trend) => (
              <InsightCard key={trend.id} insight={trend} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
