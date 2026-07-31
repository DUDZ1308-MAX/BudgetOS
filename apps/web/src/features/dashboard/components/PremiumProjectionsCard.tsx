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

const PROJECTION_ICONS: Record<string, string> = {
  '3 Month': '📊',
  '6 Month': '📈',
  '12 Month': '🎯',
};

export function PremiumProjectionsCard({ projections, isLoading, href }: Props) {
  if (isLoading) {
    return (
      <div className="premium-card p-3.5 animate-pulse sm:p-4 lg:p-5">
        <div className="h-4 w-28 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (projections.length === 0) return null;

  return (
    <ClickableCard href={href} ariaLabel="View full financial projections">
      <div className="premium-card p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Financial Projections
        </h3>

        <div className="space-y-3 flex-1">
          {projections.map((proj) => (
            <div
              key={proj.label}
              className="p-3.5 rounded-xl transition-colors hover:bg-[var(--bg-hover)] sm:p-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">{PROJECTION_ICONS[proj.label] ?? '📋'}</span>
                <span className="text-xs font-bold sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  {proj.label}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Net Worth</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    ${proj.netWorth.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Savings</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--status-success, #34d399)' }}>
                    ${proj.savings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Debt</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: proj.debt > 0 ? 'var(--status-error, #f87171)' : 'var(--status-success, #34d399)' }}>
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
