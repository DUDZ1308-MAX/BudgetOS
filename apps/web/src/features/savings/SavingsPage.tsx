import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import {
  useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal,
  useDeleteSavingsGoal, useArchiveSavingsGoal, useDupeSavingsGoal,
  useContributions, useAddContribution, useDeleteContribution,
} from '@/hooks/useSavings';
import { formatCurrency } from '@/services/transactionService';
import { computeGoalStatus, computeSavingsDashboard } from '@/engine/SavingsEngine';
import type { SavingsGoal } from '@budgetos/database';

function EmptyState({ message, description, action }: { message: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 dark:border-slate-700">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      {description && <p className="mt-1 max-w-xs text-center text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
          {action.label}
        </button>
      )}
    </div>
  );
}

function SavingsGoalCard({
  goal,
  onEdit, onDelete, onArchive, onDuplicate, onAddContribution,
}: {
  goal: SavingsGoal;
  onEdit: (g: SavingsGoal) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (g: SavingsGoal) => void;
  onAddContribution: (g: SavingsGoal) => void;
}) {
  const progress = computeGoalStatus(goal);
  const isCompleted = goal.status === 'completed';
  const isArchived = (goal as any).archived;

  const statusColors: Record<string, string> = {
    not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    on_track: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    behind: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    completed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{goal.name}</h3>
            {goal.target_date && (
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {progress.daysRemaining > 0 && ` · ${progress.daysRemaining} days left`}
              </p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[progress.status] ?? statusColors.not_started}`}>
            {progress.status === 'not_started' ? 'Not Started' : progress.status === 'on_track' ? 'On Track' : progress.status === 'behind' ? 'Behind' : 'Completed'}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Progress</span>
            <span className="font-semibold text-slate-900 dark:text-white">{progress.percentComplete.toFixed(1)}%</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(progress.percentComplete, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Saved</p>
            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(goal.current_amount))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Target</p>
            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(goal.target_amount))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Remaining</p>
            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(progress.remainingAmount)}</p>
          </div>
          {progress.monthsRemaining > 0 && progress.monthsRemaining < 1e6 && (
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Est. completion</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {progress.monthsRemaining <= 1 ? '1 month' : `${Math.ceil(progress.monthsRemaining)} months`}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!isCompleted && !isArchived && (
            <button onClick={() => onAddContribution(goal)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700">
              + Add Money
            </button>
          )}
          <button onClick={() => onEdit(goal)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Edit
          </button>
          <button onClick={() => onDuplicate(goal)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Duplicate
          </button>
          {!isArchived && (
            <button onClick={() => onArchive(goal.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              Archive
            </button>
          )}
          <button onClick={() => onDelete(goal.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalFormModal({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SavingsGoal | null;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(initial ? String(Number(initial.target_amount)) : '');
  const [currentAmount, setCurrentAmount] = useState(initial ? String(Number(initial.current_amount)) : '0');
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? '');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{initial ? 'Edit Goal' : 'New Goal'}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:text-white" placeholder="Emergency Fund" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Amount</label>
            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Amount</label>
            <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Date (optional)</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
          <button
            onClick={() => {
              onSave({ name, target_amount: Number(targetAmount), current_amount: Number(currentAmount), target_date: targetDate || null });
              onClose();
            }}
            disabled={!name || !targetAmount}
            className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {initial ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContributionModal({ open, onClose, goal, onAdd }: { open: boolean; onClose: () => void; goal: SavingsGoal | null; onAdd: (data: { goalId: string; amount: number; date: string; notes?: string }) => void }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!open || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add to "{goal.name}"</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:text-white" placeholder="Monthly contribution" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">Cancel</button>
          <button
            onClick={() => { onAdd({ goalId: goal.id, amount: Number(amount), date, notes }); onClose(); setAmount(''); setNotes(''); }}
            disabled={!amount || Number(amount) <= 0}
            className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: goals = [], isLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const archiveGoal = useArchiveSavingsGoal();
  const dupeGoal = useDupeSavingsGoal();
  const addContribution = useAddContribution();

  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const dashboard = computeSavingsDashboard(goals);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
        <button onClick={() => { setEditGoal(null); setShowForm(true); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
          + New Goal
        </button>
      </div>

      {/* Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Saved</p>
          <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(dashboard.totalSaved)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Goals</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{dashboard.activeGoals}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dashboard.completedGoals}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Largest Goal</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
            {dashboard.largestGoal ? formatCurrency(dashboard.largestGoal.target) : '-'}
          </p>
        </div>
      </div>

      {/* Goal Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          message="No savings goals yet"
          description="Create a goal to track progress toward an emergency fund, vacation, or any financial target."
          action={{ label: 'Create Goal', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => { setEditGoal(g); setShowForm(true); }}
              onDelete={(id) => setConfirmDelete(id)}
              onArchive={(id) => archiveGoal.mutate(id)}
              onDuplicate={(g) => dupeGoal.mutate({ name: `${g.name} (copy)`, target_amount: Number(g.target_amount), target_date: g.target_date })}
              onAddContribution={(g) => setContributionGoal(g)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditGoal(null); }}
        initial={editGoal}
        onSave={(data) => {
          if (editGoal) {
            updateGoal.mutate({ id: editGoal.id, data });
          } else {
            createGoal.mutate(data);
          }
        }}
      />

      <ContributionModal
        open={!!contributionGoal}
        onClose={() => setContributionGoal(null)}
        goal={contributionGoal}
        onAdd={(data) => addContribution.mutate(data)}
      />

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Goal?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">Cancel</button>
              <button onClick={() => { deleteGoal.mutate(confirmDelete); setConfirmDelete(null); }} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
