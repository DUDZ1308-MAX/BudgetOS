import { Link } from 'react-router-dom';

export function GuestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to MyBudgetOS</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          You are browsing in guest mode. Sign in or create an account to save your data and sync across devices.
        </p>

        <div className="flex gap-3">
          <Link
            to="/auth/login"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            Create Account
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Overview of your finances</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Budgets</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track spending by category</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Savings Goals</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Set and track financial goals</p>
        </div>
      </div>
    </div>
  );
}
