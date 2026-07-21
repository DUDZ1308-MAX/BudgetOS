import { memo } from 'react';
import { AnimatedCashFlow } from '@/components/dashboard/AnimatedCashFlow';

interface Props {
  cashFlowHistory: Array<{ month: string; income: number; expenses: number; net: number }>;
  currentIncome: number;
  currentExpenses: number;
  currentCashFlow: number;
  topSpending: { categoryName: string; amount: number }[];
  isLoading?: boolean;
}

export const ChartsGrid = memo(function ChartsGrid({ cashFlowHistory, currentIncome, currentExpenses, currentCashFlow, topSpending, isLoading }: Props) {
  const cashFlowData = cashFlowHistory.length > 0
    ? cashFlowHistory
    : [{ month: 'This Month', income: currentIncome, expenses: currentExpenses, net: currentCashFlow }];

  return (
    <div className="space-y-6">
      {/* Cash Flow Trend — full width */}
      <AnimatedCashFlow data={cashFlowData} isLoading={isLoading} />

      {/* Category Spending — simple bar list */}
      {topSpending.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Spending Categories</h3>
          <div className="space-y-3">
            {topSpending.map((cat, i) => {
              const maxAmount = topSpending[0]?.amount ?? 1;
              const pct = (cat.amount / maxAmount) * 100;
              return (
                <div key={cat.categoryName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cat.categoryName}</span>
                    <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cat.amount)}
                    </span>
                  </div>
                  <div className="premium-progress">
                    <div
                      className="premium-progress-bar"
                      style={{ width: `${pct}%`, background: i === 0 ? 'var(--accent-primary)' : 'var(--border-default)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
