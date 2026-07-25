import { useViewMode } from './VisualizationModeSwitch';
import { NetWorth3DLazy, CashFlow3DLazy, Spending3DLazy, BudgetProgress3DLazy, FinancialHealth3DLazy } from './LazyScene3D';
import type { NetWorth3DData, CashFlow3DData, SpendingCategory3D, BudgetProgress3DData, FinancialHealth3DData } from '../visualizationTypes';

interface Dashboard3DGridProps {
  netWorth: NetWorth3DData;
  cashFlow: CashFlow3DData;
  spending: SpendingCategory3D[];
  budgetProgress: BudgetProgress3DData[];
  healthScore: FinancialHealth3DData;
}

export function Dashboard3DGrid({ netWorth, cashFlow, spending, budgetProgress, healthScore }: Dashboard3DGridProps) {
  const { mode } = useViewMode();

  if (mode !== '3d') return null;

  return (
    <div className="space-y-6" aria-label="3D visualizations">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>3D Financial Visualization</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Net Worth</h3>
          <NetWorth3DLazy data={netWorth} height={200} />
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Cash Flow</h3>
          <CashFlow3DLazy data={cashFlow} height={200} />
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Spending Categories</h3>
          <Spending3DLazy categories={spending.length > 0 ? spending : [{ name: 'No data', amount: 0, color: 'var(--border-default)', percent: 0 }]} height={200} />
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Budget Progress</h3>
          <BudgetProgress3DLazy data={budgetProgress} height={200} />
        </div>
        <div className="rounded-xl border p-4 sm:col-span-2 xl:col-span-2" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Financial Health</h3>
          <FinancialHealth3DLazy data={healthScore} height={250} />
        </div>
      </div>
    </div>
  );
}
