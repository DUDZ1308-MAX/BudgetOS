import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardAccountSummary } from '@/lib/dashboard/types';

interface Props {
  summary: DashboardAccountSummary;
  isLoading?: boolean;
}

const Row = memo(function Row({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  const color = negative ? 'var(--status-error)' : positive ? 'var(--status-success)' : 'var(--text-primary)';
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{formatCurrency(value)}</span>
    </div>
  );
});

export const AccountSummaryCard = memo(function AccountSummaryCard({ summary, isLoading }: Props) {
  if (isLoading) {
    return (
      <DashboardCard title="Accounts" subtitle="Account balances">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-5 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />)}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Account Summary"
      subtitle="All accounts"
      accent="left"
      action={
        <a href="/accounts" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-text)' }}>
          All Accounts →
        </a>
      }
    >
      <div className="space-y-1">
        <Row label="Total Cash" value={summary.totalCash} positive />
        <Row label="Chequing" value={summary.chequing} positive />
        <Row label="Savings" value={summary.savings} positive />
        <Row label="Credit Cards" value={summary.creditCards} negative />
        <Row label="Investments" value={summary.investments} positive />
        <div className="border-t pt-1 mt-1" style={{ borderColor: 'var(--border-default)' }}>
          <Row label="Net Liquid Assets" value={summary.netLiquidAssets} positive={summary.netLiquidAssets >= 0} negative={summary.netLiquidAssets < 0} />
        </div>
      </div>
    </DashboardCard>
  );
});
