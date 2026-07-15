import { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { CreateBudgetModal } from '@/features/budgets/CreateBudgetModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconBudgets } from '@/components/ui/Icons';
import { useToastStore } from '@/stores/toast';
import type { Budget } from '@budgetos/database';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BudgetsPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useBudgets(year, month);
  const { data: categories = [] } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const addToast = useToastStore((s) => s.addToast);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  async function handleCreate(data: Parameters<typeof createBudget.mutateAsync>[0]) {
    await createBudget.mutateAsync(data);
    setShowModal(false);
  }

  async function handleUpdate(id: string, data: Parameters<typeof updateBudget.mutateAsync>[0]['data']) {
    await updateBudget.mutateAsync({ id, data });
  }

  async function handleDelete() {
    if (!deletingBudget) return;
    await deleteBudget.mutateAsync(deletingBudget.id);
    addToast('success', 'Budget deleted successfully');
    setDeletingBudget(null);
  }

  const isPending = createBudget.isPending || updateBudget.isPending;

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
          onClick={() => { setEditingBudget(null); setShowModal(true); }}
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
              onClick={() => { setEditingBudget(null); setShowModal(true); }}
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
                className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {cat?.icon ?? ''} {cat?.name ?? 'Unknown'}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {budget.rollover ? 'Rollover' : ''}
                    </span>
                    <button
                      onClick={() => { setEditingBudget(budget); setShowModal(true); }}
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      aria-label={`Edit budget for ${cat?.name ?? 'Unknown'}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingBudget(budget)}
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
                      aria-label={`Delete budget for ${cat?.name ?? 'Unknown'}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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
          isPending={isPending}
          budget={editingBudget}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={() => { setShowModal(false); setEditingBudget(null); }}
        />
      )}

      {deletingBudget && (
        <ConfirmDialog
          open={!!deletingBudget}
          onClose={() => setDeletingBudget(null)}
          onConfirm={handleDelete}
          title="Delete Budget"
          message={`Are you sure you want to delete this budget? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleteBudget.isPending}
        />
      )}
    </div>
  );
}
