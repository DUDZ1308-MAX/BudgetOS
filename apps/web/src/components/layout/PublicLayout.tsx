import { Outlet, Link } from 'react-router-dom';
import { IconCrown } from '@/components/ui/Icons';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <nav className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <IconCrown className="h-6 w-6 text-brand-600" />
          MyBudgetOS
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} MyBudgetOS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/status" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">System Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
