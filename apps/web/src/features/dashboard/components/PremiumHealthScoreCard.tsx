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
  if (score >= 80) return 'var(--status-success, #34d399)';
  if (score >= 60) return 'var(--status-warning, #fbbf24)';
  if (score >= 40) return '#f97316';
  return 'var(--status-error, #f87171)';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'var(--status-success, #34d399)';
    case 'B': return 'var(--status-warning, #fbbf24)';
    case 'C': return '#f97316';
    default: return 'var(--status-error, #f87171)';
  }
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
  const gaugeRadius = 62;
  const gaugeStroke = 10;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (overallScore / 100) * gaugeCircumference;
  const color = getScoreColor(overallScore);

  if (isLoading) {
    return (
      <div className="premium-card p-4 animate-pulse sm:p-5 lg:p-6">
        <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-40 h-40 rounded-full bg-gray-700" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-full bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <ClickableCard href={href} ariaLabel="View full financial health score">
      <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Financial Health Score
        </h3>

        {/* Large Gauge */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 140 140" className="gauge-glow">
              {/* Background track */}
              <circle cx="70" cy="70" r={gaugeRadius} fill="none" stroke="var(--bg-elevated, #334155)" strokeWidth={gaugeStroke} />
              {/* Score arc */}
              <circle
                cx="70" cy="70" r={gaugeRadius}
                fill="none"
                stroke={color}
                strokeWidth={gaugeStroke}
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeOffset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              {/* Score number */}
              <text x="70" y="62" textAnchor="middle" fill="var(--text-primary)" fontSize="36" fontWeight="800" fontFamily="inherit">
                {overallScore}
              </text>
              {/* Grade */}
              {letterGrade && (
                <text x="70" y="86" textAnchor="middle" fill={getGradeColor(letterGrade)} fontSize="20" fontWeight="700" fontFamily="inherit">
                  {letterGrade}
                </text>
              )}
              {/* Label */}
              <text x="70" y="104" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="500" fontFamily="inherit" letterSpacing="0.05em">
                OVERALL SCORE
              </text>
            </svg>
          </div>
        </div>

        {/* Subscore Breakdown */}
        {subscores && Object.entries(subscores).length > 0 && (
          <div className="space-y-3 mt-auto">
            {Object.entries(subscores).map(([key, sub]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {subscoreLabels[key] ?? key}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: getGradeColor(sub.grade) }}>
                      {sub.grade}
                    </span>
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {sub.score}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated, #334155)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${getScoreColor(sub.score)}cc, ${getScoreColor(sub.score)})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClickableCard>
  );
}
