import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

interface QuickAction {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

const actions: QuickAction[] = [
  { label: 'Add Transaction', icon: '➕', href: '/transactions/new' },
  { label: 'Transfer Money', icon: '🔄', href: '/accounts?action=transfer' },
  { label: 'Create Budget', icon: '📋', href: '/budgets?action=new' },
  { label: 'Add Contribution', icon: '🎯', href: '/savings' },
  { label: 'Add Mortgage Payment', icon: '🏠', href: '/mortgage' },
  { label: 'Generate Report', icon: '📊', href: '/reports' },
];

export const QuickActionsPanel = memo(function QuickActionsPanel() {
  return (
    <DashboardCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href ?? '#'}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1 rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </DashboardCard>
  );
});
