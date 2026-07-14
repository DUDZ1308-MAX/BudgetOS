import { useDemoStore } from '@/stores/demoMode';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { IconDemo, IconCrown, IconSparkles, IconTarget, IconChart } from '@/components/ui/Icons';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function IconCheck(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconShield(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBookOpen(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function IconLaptop(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="2" y1="21" x2="22" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const FEATURES = [
  { icon: IconChart, title: 'Smart Budgeting', description: 'Track spending by category and get alerts before you overspend.' },
  { icon: IconSparkles, title: 'AI Financial Copilot', description: 'Ask questions and get personalized financial insights.' },
  { icon: IconTarget, title: 'Goal Tracking', description: 'Set savings goals and watch your progress with visual milestones.' },
  { icon: IconCrown, title: 'Multi-Account Support', description: 'Manage all your accounts in one place.' },
  { icon: IconBookOpen, title: 'Reports & Analytics', description: 'Understand patterns with beautiful reports and exports.' },
  { icon: IconLaptop, title: 'Cross-Device Sync', description: 'Your data syncs automatically across all your devices.' },
];

export function DemoPage() {
  const navigate = useNavigate();
  const { enterDemo } = useDemoStore();

  const handleEnterDemo = () => {
    enterDemo();
    navigate('/dashboard');
  };

  return (
    <div className="overflow-x-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Nav */}
      <nav className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 px-4 md:px-8">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <IconCrown className="h-6 w-6 text-brand-600" />
          MyBudgetOS
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <IconDemo className="h-3.5 w-3.5" />
            Demo
          </span>
          <button
            onClick={() => navigate('/auth/signup')}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Create Your Account
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative isolate overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <IconDemo className="h-3.5 w-3.5" />
            Interactive Demo
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Explore MyBudgetOS Risk-Free
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Try all features with realistic sample data. No account needed, no commitment required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleEnterDemo}
              className="rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all"
            >
              Launch Demo
            </button>
            <button
              onClick={() => navigate('/auth/signup')}
              className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">What You'll See</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Experience the full power of MyBudgetOS with pre-loaded sample data.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <f.icon className="h-5 w-5 text-brand-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Preview */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Pre-loaded With Sample Data</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Jump right in with realistic financial data — accounts, transactions, budgets, savings goals, and a mortgage.
                See how the AI Copilot analyzes real financial patterns.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  '4 bank accounts with real balances',
                  '30+ sample transactions across categories',
                  'Pre-configured budgets with spending tracking',
                  '3 savings goals with progress',
                  'Mortgage calculator with amortization',
                  'AI Financial Copilot with live demo data',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <IconCheck className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">DM</div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Demo Data</p>
                  <p className="text-xs text-slate-400">Sample financial profile</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Monthly Income', value: '$8,450' },
                  { label: 'Monthly Expenses', value: '$5,230' },
                  { label: 'Net Worth', value: '$45,280' },
                  { label: 'Accounts', value: '4' },
                  { label: 'AI Requests', value: 'Unlimited in demo' },
                ].map((d) => (
                  <div key={d.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span className="text-xs text-slate-500">{d.label}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-purple-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Ready to Get Started?</h2>
          <p className="mt-3 text-white/80">Create your free account and start your financial journey today.</p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleEnterDemo}
              className="rounded-xl border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Try Demo First
            </button>
            <button
              onClick={() => navigate('/auth/signup')}
              className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 hover:bg-slate-100 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <p className="text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} MyBudgetOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
