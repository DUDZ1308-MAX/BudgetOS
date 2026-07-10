import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '@/stores/subscription';
import { SubscriptionService } from '@/billing/subscriptionService';
import { PLANS } from '@/billing/pricingPlans';
import type { PricingPlan, BillingInterval } from '@/billing/pricingPlans';

export function PricingPage() {
  const tier = useSubscriptionStore((s) => s.tier);
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === tier) {
      navigate('/billing');
      return;
    }

    if (plan.id === 'free') {
      await SubscriptionService.downgradeToFree();
      navigate('/billing');
      return;
    }

    setLoadingPlan(plan.id);
    setError(null);
    try {
      const result = await SubscriptionService.upgrade(plan.id, interval);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Choose Your Plan</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Pick the plan that fits your financial journey
        </p>

        <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setInterval('month')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              interval === 'month'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              interval === 'year'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Yearly <span className="text-emerald-500">Save 17%</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === tier;
          const price = interval === 'month' ? plan.monthlyPrice : plan.yearlyPricePerMonth;
          const totalPrice = interval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;
          const isLoading = loadingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
                plan.popular
                  ? 'border-brand-400 shadow-lg shadow-brand-100 dark:border-brand-600 dark:shadow-brand-900/20'
                  : isCurrent
                    ? 'border-brand-300 dark:border-brand-700'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.popular
                      ? 'bg-brand-600 text-white'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5 text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
              </div>

              <div className="mb-5 text-center">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">${price}</span>
                <span className="ml-1 text-sm text-slate-500">/mo</span>
                {interval === 'year' && plan.yearlyPrice > 0 && (
                  <p className="mt-1 text-xs text-slate-400">${totalPrice}/year</p>
                )}
                {plan.monthlyPrice === 0 && (
                  <p className="mt-1 text-xs text-slate-400">Free forever</p>
                )}
              </div>

              {plan.trialDays > 0 && (
                <p className="mb-4 text-center text-xs text-brand-600 dark:text-brand-400">
                  {plan.trialDays}-day free trial
                </p>
              )}

              <div className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f.key} className="flex items-start gap-2 text-xs">
                    {f.included ? (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={f.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                      {f.label}{f.limitLabel ? ` (${f.limitLabel})` : ''}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isLoading}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isCurrent
                    ? 'border-2 border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                    : plan.popular
                      ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                      : 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Processing...' : isCurrent ? 'Current Plan' : plan.monthlyPrice === 0 ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          All plans include basic budgeting and account management.
          {interval === 'month' ? ' Save with annual billing.' : ''}
        </p>
      </div>
    </div>
  );
}
