import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600 dark:text-brand-400">MyBudgetOS</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Plan. Track. Grow.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
