import { ClickableCard } from '@/components/dashboard/ClickableCard';

interface Projection {
  label: string;
  months: number;
  netWorth: number;
  savings: number;
  debt: number;
  cashFlow: number;
  emergencyFundMonths: number;
}

interface Props {
  projections: Projection[];
  isLoading?: boolean;
  href?: string;
}

export function PremiumProjectionsCard({ projections, isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-5 animate-pulse">
        <div className="h-4 w-28 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (projections.length === 0) return null;

  return (
    <ClickableCard href={href} ariaLabel="View full financial projections">
      <div className="premium-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Financial Projections
        </h3>

        <div className="space-y-3">
          {projections.map((proj) => (
            <div
              key={proj.label}
              className="p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {proj.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Projected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Net Worth</div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${proj.netWorth.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Savings</div>
                  <div className="font-semibold" style={{ color: 'var(--color-success)' }}>
                    ${proj.savings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Debt</div>
                  <div className="font-semibold" style={{ color: proj.debt > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    ${proj.debt.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClickableCard>
  );
}
