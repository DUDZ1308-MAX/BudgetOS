import { motion } from 'framer-motion';
import { ClickableCard } from '@/components/dashboard/ClickableCard';

interface SubscoreData {
  score: number;
  grade: string;
  trend: string;
  explanation: string;
}

interface Props {
  overallScore: number;
  letterGrade?: string;
  tier?: string;
  subscores?: Record<string, SubscoreData>;
  isLoading?: boolean;
  href?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  if (score >= 40) return 'var(--color-orange)';
  return 'var(--color-danger)';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'var(--color-success)';
    case 'B': return 'var(--color-warning)';
    case 'C': return 'var(--color-orange)';
    default: return 'var(--color-danger)';
  }
}

function TrendIndicator({ trend }: { trend: string }) {
  if (trend === 'improving') return <span className="text-emerald-500 text-xs">↑ Improving</span>;
  if (trend === 'declining') return <span className="text-red-500 text-xs">↓ Declining</span>;
  return <span className="text-gray-400 text-xs">→ Stable</span>;
}

const subscoreLabels: Record<string, string> = {
  spending: 'Spending',
  savings: 'Savings',
  debt: 'Debt',
  cashFlow: 'Cash Flow',
  emergencyFund: 'Emergency Fund',
  budgetAdherence: 'Budget Adherence',
  netWorthGrowth: 'Net Worth Growth',
};

export function PremiumHealthScoreCard({ overallScore, letterGrade, subscores, isLoading, href }: Props) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (overallScore / 100) * circumference;
  const color = getScoreColor(overallScore);

  if (isLoading) {
    return (
      <div className="premium-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-36 h-36 rounded-full bg-gray-700" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <ClickableCard href={href} ariaLabel="View full financial health score">
      <div className="premium-card p-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Financial Health Score
        </h3>

        <div className="flex justify-center mb-4">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
            <text x="60" y="52" textAnchor="middle" fill="var(--text-primary)" fontSize="24" fontWeight="bold">
              {overallScore}
            </text>
            {letterGrade && (
              <text x="60" y="74" textAnchor="middle" fill={getGradeColor(letterGrade)} fontSize="16" fontWeight="bold">
                {letterGrade}
              </text>
            )}
          </svg>
        </div>

        {subscores && Object.entries(subscores).length > 0 && (
          <div className="space-y-3 mt-4">
            {Object.entries(subscores).map(([key, sub]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {subscoreLabels[key] ?? key}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: getGradeColor(sub.grade) }}>
                        {sub.grade}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {sub.score}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: getScoreColor(sub.score), width: `${sub.score}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClickableCard>
  );
}
