import { useState } from 'react';
import { useBudgets, useCreateBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { CreateBudgetModal } from '@/features/budgets/CreateBudgetModal';
import { IconBudgets } from '@/components/ui/Icons';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BudgetsPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);

  const { data: budgets = [], isLoading } = useBudgets(year, month);
  const { data: categories = [] } = useCategories();
  const createBudget = useCreateBudget();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  async function handleCreate(data: Parameters<typeof createBudget.mutateAsync>[0]) {
    await createBudget.mutateAsync(data);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Create Budget
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full text-sm text-slate-400">Loading budgets...</p>
        ) : budgets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 dark:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
              <IconBudgets className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">No budgets for {MONTH_NAMES[month - 1]}</h3>
            <p className="mt-1 max-w-sm text-center text-xs text-slate-500 dark:text-slate-400">
              Set spending limits per category to track where your money goes and stay on target each month.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Create your first budget
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const cat = budget.category_id ? categoryMap.get(budget.category_id) : null;
            return (
              <div
                key={budget.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {cat?.icon ?? ''} {cat?.name ?? 'Unknown'}
                  </p>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {budget.rollover ? 'Rollover' : ''}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{ width: '0%' }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  ${Number(budget.amount).toFixed(2)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <CreateBudgetModal
          categories={categories}
          isPending={createBudget.isPending}
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
