export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Add Transaction
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Description</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Category</th>
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                No transactions yet. Add your first one to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
