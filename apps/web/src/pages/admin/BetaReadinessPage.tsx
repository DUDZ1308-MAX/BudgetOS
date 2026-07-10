import { useState, useMemo } from 'react';
import { IconFeatureFlag } from '@/components/ui/Icons';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  check: () => boolean;
}

function useChecklist() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const items: ChecklistItem[] = useMemo(() => [
    // Legal & Compliance
    { id: 'legal-privacy', category: 'Legal & Compliance', title: 'Privacy Policy Published', description: 'Privacy policy page is accessible at /privacy', required: true, check: () => true },
    { id: 'legal-terms', category: 'Legal & Compliance', title: 'Terms of Service Published', description: 'Terms of service page is accessible at /terms', required: true, check: () => true },
    { id: 'legal-checkbox', category: 'Legal & Compliance', title: 'Registration Legal Checkbox', description: 'Signup form includes Terms/Privacy agreement checkbox', required: true, check: () => true },
    // Authentication
    { id: 'auth-signup', category: 'Authentication', title: 'Signup Flow Working', description: 'New users can create accounts', required: true, check: () => true },
    { id: 'auth-login', category: 'Authentication', title: 'Login Flow Working', description: 'Existing users can sign in', required: true, check: () => true },
    { id: 'auth-password-reset', category: 'Authentication', title: 'Password Reset Working', description: 'Users can reset forgotten passwords', required: true, check: () => true },
    // Billing
    { id: 'billing-stripe', category: 'Billing', title: 'Stripe Live Mode Configured', description: 'Production Stripe keys are set and working', required: true, check: () => import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ?? false },
    { id: 'billing-webhook', category: 'Billing', title: 'Stripe Webhook Endpoint Active', description: 'Webhook endpoint is configured in Stripe dashboard', required: true, check: () => true },
    { id: 'billing-plans', category: 'Billing', title: 'Pricing Plans Visible', description: 'All pricing tiers display correctly on /pricing', required: true, check: () => true },
    // Monitoring
    { id: 'monitoring-logger', category: 'Monitoring', title: 'Logger Operational', description: 'Application logging is capturing errors and warnings', required: true, check: () => true },
    { id: 'monitoring-metrics', category: 'Monitoring', title: 'Performance Metrics Tracked', description: 'Performance monitoring is collecting metrics', required: true, check: () => true },
    { id: 'monitoring-errors', category: 'Monitoring', title: 'Error Reporting Active', description: 'Error reporter captures and formats exceptions', required: true, check: () => true },
    // Data Safety
    { id: 'data-backup', category: 'Data Safety', title: 'Backup System Functional', description: 'Users can create, list, restore, and download backups', required: true, check: () => true },
    { id: 'data-export', category: 'Data Safety', title: 'Data Export Working', description: 'PDF, CSV, Excel export functions available', required: true, check: () => true },
    { id: 'data-deletion', category: 'Data Safety', title: 'Account Deletion Available', description: 'Users can delete their account and data', required: true, check: () => true },
    // Infrastructure
    { id: 'infra-env', category: 'Infrastructure', title: 'Environment Config Validated', description: 'All required env vars are present and validated', required: true, check: () => true },
    { id: 'infra-supabase', category: 'Infrastructure', title: 'Supabase Connected', description: 'Supabase client initializes with valid keys', required: true, check: () => !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY },
    { id: 'infra-ssl', category: 'Infrastructure', title: 'HTTPS Enabled', description: 'Production URL uses HTTPS', required: true, check: () => window.location.protocol === 'https:' || import.meta.env.DEV },
    // Performance
    { id: 'perf-lazy-loading', category: 'Performance', title: 'Code Splitting Active', description: 'All page components are lazily loaded', required: true, check: () => true },
    { id: 'perf-bundle-size', category: 'Performance', title: 'Bundle Size Optimized', description: 'Vendor chunks are separated in build output', required: true, check: () => true },
    // UX
    { id: 'ux-mobile', category: 'UX & Accessibility', title: 'Mobile Responsive', description: 'All pages render correctly on mobile viewports', required: true, check: () => true },
    { id: 'ux-dark-mode', category: 'UX & Accessibility', title: 'Dark Mode Working', description: 'Dark mode toggle functions correctly', required: true, check: () => true },
    { id: 'ux-a11y', category: 'UX & Accessibility', title: 'Accessibility Basics', description: 'Skip nav, ARIA labels, keyboard navigation present', required: true, check: () => true },
    { id: 'ux-status-page', category: 'UX & Accessibility', title: 'Status Page Published', description: 'System status page is accessible at /status', required: true, check: () => true },
    { id: 'ux-help-center', category: 'UX & Accessibility', title: 'Help Center Published', description: 'Help center is accessible at /help', required: true, check: () => true },
    { id: 'ux-onboarding', category: 'UX & Accessibility', title: 'User Onboarding Active', description: 'Onboarding wizard triggers on first login', required: true, check: () => true },
    // Feedback
    { id: 'fb-widget', category: 'Feedback', title: 'Feedback Widget Visible', description: 'Feedback FAB is shown in the app shell', required: true, check: () => true },
    { id: 'fb-submission', category: 'Feedback', title: 'Feedback Submission Works', description: 'Users can submit bug reports and feature requests', required: true, check: () => true },
    // Security
    { id: 'sec-input-sanitization', category: 'Security', title: 'Input Sanitization Applied', description: 'User inputs are sanitized before rendering', required: true, check: () => true },
    { id: 'sec-rate-limiting', category: 'Security', title: 'Client Rate Limiter Active', description: 'Rate limiting prevents abuse of forms', required: true, check: () => true },
    // Release
    { id: 'rel-release-notes', category: 'Release', title: 'Release Notes Published', description: 'Release notes page shows version history', required: true, check: () => true },
    { id: 'rel-whats-new', category: 'Release', title: 'What\'s New Modal Working', description: 'Modal triggers on version update', required: true, check: () => true },
    // Documentation
    { id: 'doc-architecture', category: 'Documentation', title: 'Architecture Doc Available', description: 'ARCHITECTURE.md is up to date', required: true, check: () => true },
    { id: 'doc-deployment', category: 'Documentation', title: 'Deployment Guide Available', description: 'DEPLOYMENT.md covers production setup', required: true, check: () => true },
    { id: 'doc-dev-setup', category: 'Documentation', title: 'Developer Setup Guide Available', description: 'DEVELOPER_SETUP.md covers local development', required: true, check: () => true },
    { id: 'doc-domain-config', category: 'Documentation', title: 'Domain Config Documented', description: 'Domain configuration is documented', required: true, check: () => true },
  ], []);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = items.length;
  const done = completed.size;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const requiredItems = items.filter((i) => i.required);
  const requiredDone = requiredItems.filter((i) => completed.has(i.id)).length;
  const allRequiredMet = requiredDone === requiredItems.length;

  return { items, completed, toggle, total, done, percent, allRequiredMet, requiredDone, requiredItems: requiredItems.length };
}

export function BetaReadinessPage() {
  const { items, completed, toggle, total, done, percent, allRequiredMet, requiredDone, requiredItems } = useChecklist();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const filtered = activeCategory ? items.filter((i) => i.category === activeCategory) : items;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <IconFeatureFlag className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Beta Readiness Checklist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Verify all systems are ready for public beta launch.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{percent}%</span>
            <p className="text-sm text-slate-500">{done} of {total} items checked</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              allRequiredMet
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${allRequiredMet ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {allRequiredMet ? 'All Requirements Met' : `${requiredDone}/${requiredItems} Required Done`}
            </span>
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-3 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            !activeCategory
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              completed.has(item.id)
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  completed.has(item.id)
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {completed.has(item.id) && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</span>
                    {item.required && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{item.category}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
