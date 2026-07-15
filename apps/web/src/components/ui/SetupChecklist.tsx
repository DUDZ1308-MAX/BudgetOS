import { useNavigate } from 'react-router-dom';
import { useSetupChecklistStore, type ChecklistItem } from '@/stores/setupChecklist';
import { IconCheckCircle, IconAccounts, IconTransactions, IconBudgets, IconSavings, IconMortgage, IconSparkles, IconReports, IconRocket } from '@/components/ui/Icons';

interface ChecklistEntry {
  id: ChecklistItem;
  label: string;
  description: string;
  route: string;
  icon: typeof IconCheckCircle;
}

const ITEMS: ChecklistEntry[] = [
  { id: 'add_account', label: 'Add an account', description: 'Link a bank account or create one manually', route: '/accounts', icon: IconAccounts },
  { id: 'add_transaction', label: 'Log a transaction', description: 'Record your first income or expense', route: '/transactions', icon: IconTransactions },
  { id: 'create_budget', label: 'Create a budget', description: 'Set spending limits for your categories', route: '/budgets', icon: IconBudgets },
  { id: 'set_savings_goal', label: 'Set a savings goal', description: 'Start tracking progress toward a goal', route: '/savings', icon: IconSavings },
  { id: 'add_mortgage', label: 'Add your mortgage', description: 'See payoff projections and interest savings', route: '/mortgage', icon: IconMortgage },
  { id: 'try_ai_copilot', label: 'Try the AI Copilot', description: 'Ask questions about your finances', route: '/ai', icon: IconSparkles },
  { id: 'explore_reports', label: 'Explore reports', description: 'Visualize your cash flow and trends', route: '/reports', icon: IconReports },
];

export function SetupChecklist() {
  const navigate = useNavigate();
  const { completed, isDismissed, dismiss } = useSetupChecklistStore();

  const doneCount = completed.length;
  const total = ITEMS.length;
  const allDone = doneCount === total;

  if (allDone || isDismissed) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50">
            <IconRocket className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Getting Started</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{doneCount} of {total} complete</p>
          </div>
        </div>
        <button onClick={dismiss} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Dismiss checklist">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {ITEMS.map((item) => {
          const isDone = completed.includes(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                isDone
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isDone
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {isDone ? (
                  <IconCheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${isDone ? 'text-emerald-700 line-through dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
