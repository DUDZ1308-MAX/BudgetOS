import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useMortgages, useCreateMortgage, useUpdateMortgage, useDeleteMortgage, useExtraPayments, useAddExtraPayment, useDeleteExtraPayment } from '@/hooks/useMortgage';
import { formatCurrency } from '@/services/transactionService';
import { computeMortgage, computeMortgageDashboard } from '@/engine/MortgageEngine';

function EmptyState({ message, description, action }: { message: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 dark:border-slate-700">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      {description && <p className="mt-1 max-w-xs text-center text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      {action && <button onClick={action.onClick} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{action.label}</button>}
    </div>
  );
}

function MortgageFormModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [termYears, setTermYears] = useState('30');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New Mortgage</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Property Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" placeholder="Home" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Loan Amount</label>
              <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Interest Rate %</label>
              <input type="number" step="0.01" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Term (years)</label>
              <input type="number" value={termYears} onChange={(e) => setTermYears(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">Cancel</button>
          <button onClick={() => { onSave({ name, principal: Number(principal), annual_rate: Number(annualRate), term_years: Number(termYears), start_date: startDate }); onClose(); }} disabled={!name || !principal || !annualRate} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}

function ExtraPaymentModal({ open, onClose, mortgageId, onAdd }: { open: boolean; onClose: () => void; mortgageId: string; onAdd: (data: { mortgageId: string; amount: number; date: string; notes?: string }) => void }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Extra Payment</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">Cancel</button>
          <button onClick={() => { onAdd({ mortgageId, amount: Number(amount), date }); onClose(); setAmount(''); }} disabled={!amount || Number(amount) <= 0} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
}

export function MortgagePage() {
  const user = useAuthStore((s) => s.user);
  const { data: mortgages = [], isLoading } = useMortgages();
  const createMortgage = useCreateMortgage();
  const updateMortgage = useUpdateMortgage();
  const deleteMortgage = useDeleteMortgage();
  const addExtraPayment = useAddExtraPayment();
  const deleteExtraPayment = useDeleteExtraPayment();

  const [showForm, setShowForm] = useState(false);
  const [activeMortgageId, setActiveMortgageId] = useState<string | null>(null);
  const [showExtraPayment, setShowExtraPayment] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeMortgage = activeMortgageId ? mortgages.find((m) => m.id === activeMortgageId) ?? mortgages[0] ?? null : mortgages[0] ?? null;
  const selectedId = activeMortgage?.id;

  const { data: extraPayments = [] } = useExtraPayments(selectedId);

  const calcResult = useMemo(() => {
    if (!activeMortgage) return null;
    return computeMortgage({
      principal: Number(activeMortgage.principal),
      annualRate: Number(activeMortgage.annual_rate),
      termYears: Number(activeMortgage.term_years),
      startDate: activeMortgage.start_date ?? new Date().toISOString().slice(0, 10),
      extraPayments: extraPayments.map((ep) => ({ amount: Number(ep.amount), date: ep.date })),
    });
  }, [activeMortgage, extraPayments]);

  const dashboard = useMemo(() => calcResult ? computeMortgageDashboard(calcResult) : null, [calcResult]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mortgage</h1>
        <div className="flex gap-2">
          {mortgages.length > 1 && (
            <select
              value={activeMortgage?.id ?? ''}
              onChange={(e) => setActiveMortgageId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:text-white"
            >
              {mortgages.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowForm(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New Mortgage</button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : !activeMortgage ? (
        <EmptyState
          message="No mortgages yet"
          description="Add your mortgage to see payoff projections, amortization schedules, and how extra payments save you interest."
          action={{ label: 'Add Mortgage', onClick: () => setShowForm(true) }}
        />
      ) : (
        <>
          {/* Dashboard stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Remaining Balance</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(dashboard?.remainingBalance ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Payment</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(dashboard?.monthlyPayment ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Payoff Date</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{dashboard?.payoffDate ? new Date(dashboard.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Interest</p>
              <p className="mt-1.5 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(dashboard?.totalInterest ?? 0)}</p>
            </div>
          </div>

          {/* Progress ring */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-8">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-700" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGrad)" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min((dashboard?.progressPct ?? 0) / 100, 1))}`} strokeLinecap="round" className="transition-all duration-700" />
                  <defs><linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                </svg>
                <span className="absolute text-lg font-bold text-slate-900 dark:text-white">{Math.round(dashboard?.progressPct ?? 0)}%</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-400 w-28">Principal Paid</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(dashboard?.principalPaid ?? 0)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-400 w-28">Interest Paid</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(dashboard?.interestPaid ?? 0)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-400 w-28">Interest Saved</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(calcResult?.interestSaved ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Payments + Schedule */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Extra Payments */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Extra Payments</h3>
                <button onClick={() => setShowExtraPayment(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">+ Add</button>
              </div>
              <div className="p-5">
                {extraPayments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No extra payments added.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {extraPayments.map((ep) => (
                      <div key={ep.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(Number(ep.amount))}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(ep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <button onClick={() => deleteExtraPayment.mutate({ id: ep.id, mortgageId: selectedId! })} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amortization Schedule */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Amortization Schedule</h3>
                <button onClick={() => setShowSchedule(!showSchedule)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  {showSchedule ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="p-5">
                {showSchedule && calcResult?.schedule ? (
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 dark:text-slate-500">
                          <th className="pb-2 pr-2 font-medium">#</th>
                          <th className="pb-2 pr-2 font-medium">Date</th>
                          <th className="pb-2 pr-2 font-medium">Payment</th>
                          <th className="pb-2 pr-2 font-medium">Principal</th>
                          <th className="pb-2 pr-2 font-medium">Interest</th>
                          <th className="pb-2 font-medium">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {calcResult.schedule.map((row) => (
                          <tr key={row.month} className="text-slate-700 dark:text-slate-300">
                            <td className="py-1.5 pr-2">{row.month}</td>
                            <td className="py-1.5 pr-2">{new Date(row.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                            <td className="py-1.5 pr-2">{formatCurrency(row.payment)}</td>
                            <td className="py-1.5 pr-2">{formatCurrency(row.principal)}</td>
                            <td className="py-1.5 pr-2">{formatCurrency(row.interest)}</td>
                            <td className="py-1.5 font-medium">{formatCurrency(row.remainingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                    {calcResult?.schedule ? `View ${calcResult.schedule.length} payments` : 'No schedule available.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <MortgageFormModal open={showForm} onClose={() => setShowForm(false)} onSave={(data) => { createMortgage.mutate(data); setShowForm(false); }} />
      {selectedId && <ExtraPaymentModal open={showExtraPayment} onClose={() => setShowExtraPayment(false)} mortgageId={selectedId} onAdd={(data) => addExtraPayment.mutate(data)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Mortgage?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">Cancel</button>
              <button onClick={() => { deleteMortgage.mutate(confirmDelete); setConfirmDelete(null); }} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
