import { useState, useCallback, useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/subscription';
import { useUsageStore } from '@/stores/usage';
import { getPlan } from '@/billing/pricingPlans';
import { SubscriptionService } from '@/billing/subscriptionService';
import { getUsageByAction } from '@/billing/usageTracker';
import { canProcessPayments } from '@/billing/stripe/stripeSafety';
import { checkoutConfirmationForTier } from '@/billing/stripe/checkoutConfirmation';
import { useNavigate, useSearchParams } from 'react-router-dom';

type CheckoutStatus = null | 'processing' | 'success' | 'canceled' | 'confirming';

const CHECKOUT_CONFIRM_ATTEMPTS = 6;
const CHECKOUT_CONFIRM_DELAY_MS = 3000;

export function BillingPage() {
  const { tier, status, interval, cancelAtPeriodEnd, currentPeriodEnd, trialEnd } = useSubscriptionStore();
  const { userId } = useUsageStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>(null);

  const paymentsAvailable = canProcessPayments().allowed;
  const checkoutParam = searchParams.get('checkout');

  // After returning from Stripe Checkout, only show the success message
  // once the server confirms a paid tier (webhook-driven entitlement).
  // Until then, show a neutral confirmation message and never claim the
  // subscription is active.
  const confirmCheckout = useCallback(async () => {
    for (let attempt = 0; attempt < CHECKOUT_CONFIRM_ATTEMPTS; attempt++) {
      try {
        await SubscriptionService.refreshFromServer();
      } catch {
        // sync failures already fail the store to FREE; keep retrying
      }
      if (
        checkoutConfirmationForTier(useSubscriptionStore.getState().tier) === 'active'
      ) {
        setCheckoutStatus('success');
        return;
      }
      if (attempt < CHECKOUT_CONFIRM_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, CHECKOUT_CONFIRM_DELAY_MS));
      }
    }
    setCheckoutStatus('confirming');
  }, []);

  useEffect(() => {
    if (checkoutParam === 'success') {
      setCheckoutStatus('processing');
      confirmCheckout();
    } else if (checkoutParam === 'canceled') {
      setCheckoutStatus('canceled');
    }
  }, [checkoutParam, confirmCheckout]);

  // If the entitlement lands after the retry window (periodic sync),
  // flip the banner to active without claiming access before then.
  useEffect(() => {
    if (checkoutStatus === 'confirming' && tier !== 'free') {
      setCheckoutStatus('success');
    }
  }, [checkoutStatus, tier]);

  const plan = getPlan(tier);
  const usage = userId ? getUsageByAction(userId) : { ai_request: 0, export_csv: 0, export_pdf_excel: 0, export_json: 0 };
  const aiUsagePercent = plan.features.find((f) => f.key === 'ai_copilot')?.limit
    ? Math.min(100, Math.round((usage.ai_request / (plan.features.find((f) => f.key === 'ai_copilot')?.limit ?? 1)) * 100))
    : 0;

  const handleUpgrade = useCallback(async () => {
    if (!paymentsAvailable) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await SubscriptionService.upgrade('pro', interval);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setIsLoading(false);
    }
  }, [interval, paymentsAvailable]);

  const handleManageSubscription = useCallback(async () => {
    if (!paymentsAvailable) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await SubscriptionService.manageSubscription();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  }, [paymentsAvailable]);

  const priceDisplay = interval === 'month'
    ? `$${plan.monthlyPrice}/mo`
    : `$${plan.yearlyPrice}/yr ($${plan.yearlyPricePerMonth}/mo)`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing</h1>
        <button
          onClick={() => navigate('/pricing')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Compare Plans
        </button>
      </div>

      {checkoutStatus === 'processing' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Verifying your subscription…
          </p>
        </div>
      )}

      {checkoutStatus === 'success' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Payment successful! Your subscription is now active.
          </p>
        </div>
      )}

      {checkoutStatus === 'confirming' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Checkout completed. We&apos;re confirming your subscription…
          </p>
        </div>
      )}

      {checkoutStatus === 'canceled' && checkoutParam === 'canceled' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">Checkout was canceled. No charges were made.</p>
        </div>
      )}

      {!paymentsAvailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Payments are currently unavailable.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Current Plan</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
            status === 'trialing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {status === 'trialing' ? 'Trial' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {tier !== 'free' && (
          <div className="mb-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <p>{priceDisplay}</p>
            {cancelAtPeriodEnd ? (
              <p className="text-amber-600 dark:text-amber-400">
                Cancels at period end ({currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'N/A'})
              </p>
            ) : currentPeriodEnd ? (
              <p>Next billing date: {new Date(currentPeriodEnd).toLocaleDateString()}</p>
            ) : null}
            {status === 'trialing' && trialEnd && (
              <p className="text-blue-600 dark:text-blue-400">
                Trial ends {new Date(trialEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          {plan.features.map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-sm">
              {f.included ? (
                <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={f.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                {f.label}{f.limitLabel ? ` (${f.limitLabel})` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Monthly Usage</h3>

        <div className="space-y-4">
          <UsageBar
            label="AI Requests"
            used={usage.ai_request}
            limit={plan.features.find((f) => f.key === 'ai_copilot')?.limit}
            percent={aiUsagePercent}
            color="brand"
          />
          <UsageBar
            label="CSV Exports"
            used={usage.export_csv}
            limit={tier === 'free' ? 0 : undefined}
            percent={0}
            color="slate"
          />
          <UsageBar
            label="PDF/Excel Exports"
            used={usage.export_pdf_excel}
            limit={tier === 'free' ? 0 : undefined}
            percent={0}
            color="slate"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {tier === 'free' ? (
          <div className="text-center">
            <p className="mb-1 text-sm font-medium text-slate-900 dark:text-white">Upgrade to Pro</p>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Get unlimited transactions, full AI access, exports, and more.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isLoading || !paymentsAvailable}
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleManageSubscription}
              disabled={isLoading || !paymentsAvailable}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
            >
              {isLoading ? 'Loading...' : 'Manage Subscription'}
            </button>

            {!cancelAtPeriodEnd ? (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading || !paymentsAvailable}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                Cancel Subscription
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading || !paymentsAvailable}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
              >
                Resume Subscription
              </button>
            )}
            <p className="text-center text-xs text-slate-400">
              Cancel or resume is managed securely through the Stripe billing portal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, used, limit, percent, color }: {
  label: string;
  used: number;
  limit?: number;
  percent: number;
  color: string;
}) {
  const barColor = color === 'brand' ? 'bg-brand-500' : 'bg-slate-400';
  const showLimit = limit !== undefined && limit !== null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-500 dark:text-slate-500">
          {used}{showLimit ? ` / ${limit}` : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {showLimit && limit > 0 && (
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        )}
      </div>
    </div>
  );
}
