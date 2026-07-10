import { useDemoStore } from '@/stores/demoMode';
import { IconDemo } from '@/components/ui/Icons';
import { Link } from 'react-router-dom';

export function DemoBanner() {
  const { isDemo, exitDemo } = useDemoStore();
  if (!isDemo) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-500/10 px-4 py-2.5 text-sm border-b border-amber-500/20">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <IconDemo className="h-4 w-4" />
        <span className="font-medium">Demo Mode</span>
        <span className="hidden sm:inline text-amber-600 dark:text-amber-300">— Exploring with sample data. Changes are not saved.</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/auth/signup"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Create Your Account
        </Link>
        <button
          onClick={exitDemo}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
