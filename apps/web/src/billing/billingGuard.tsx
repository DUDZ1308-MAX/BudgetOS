import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { canAccess } from '@/billing/access/billingGuard';
import { hasFeatureAccess, getTierUpgradeTarget } from '@/billing/planMatrix';
import type { FeatureKey } from '@/billing/planMatrix';
import { getPlan } from '@/billing/pricingPlans';
import type { SubscriptionTier } from '@/billing/pricingPlans';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: FeatureKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const tier = useSubscriptionStore((s) => s.tier);
  const hasAccess = hasFeatureAccess(tier, feature);

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return <UpgradeBlock feature={feature} currentTier={tier} />;
}

function UpgradeBlock({ feature, currentTier }: { feature: FeatureKey; currentTier: SubscriptionTier }) {
  const target = getTierUpgradeTarget(currentTier, feature);
  const plan = target ? getPlan(target) : null;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mb-3 rounded-full bg-brand-100 p-3 dark:bg-brand-900/30">
        <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Premium Feature</h3>
      <p className="mb-4 max-w-xs text-xs text-slate-500 dark:text-slate-400">
        {plan ? `Upgrade to ${plan.name} to unlock this feature.` : 'Upgrade to a paid plan to unlock this feature.'}
      </p>
      {plan && (
        <button
          onClick={() => navigate('/pricing')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700"
        >
          {plan.monthlyPrice > 0 ? `Upgrade to ${plan.name} — $${plan.monthlyPrice}/mo` : 'View Plans'}
        </button>
      )}
    </div>
  );
}

interface UpgradePromptProps {
  message?: string;
  compact?: boolean;
  variant?: 'default' | 'banner';
}

export function UpgradePrompt({ message, compact, variant }: UpgradePromptProps) {
  const navigate = useNavigate();

  if (compact || variant === 'banner') {
    return (
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Upgrade
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {message ?? 'Unlock premium features'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Upgrade your plan to get full access to all features including AI Copilot, exports, and more.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-4 mt-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
            <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upgrade Required</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {feature
              ? `"${feature}" is a premium feature. Upgrade your plan to access it.`
              : 'This feature requires a paid plan.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={() => { onClose(); navigate('/pricing'); }}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
