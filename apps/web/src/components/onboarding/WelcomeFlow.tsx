import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore, getNextStep, getStepIndex, getTotalSteps } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';
import { useAuthStore } from '@/stores/auth';
import { useSetupChecklistStore } from '@/stores/setupChecklist';

const WELCOME_FEATURES = [
  { icon: '💰', title: 'Track Accounts', description: 'Manage all your bank accounts, credit cards, and cash in one place' },
  { icon: '📊', title: 'Smart Budgets', description: 'Set spending limits and track your progress in real-time' },
  { icon: '🎯', title: 'Savings Goals', description: 'Define goals and watch your progress grow' },
  { icon: '🤖', title: 'AI Copilot', description: 'Get personalized insights and recommendations' },
];

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const navigate = useNavigate();
  const { currentStep, setStep, complete, skip } = useOnboardingStore();
  const { updateProfile } = useProfileStore();
  const user = useAuthStore((s) => s.user);
  const { complete: markChecklistItem } = useSetupChecklistStore();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [isProcessing, setIsProcessing] = useState(false);

  const stepIndex = getStepIndex(currentStep);
  const totalSteps = getTotalSteps();
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const handleNext = async () => {
    setIsProcessing(true);
    try {
      if (currentStep === 'profile' && fullName.trim()) {
        await updateProfile(user!.id, { full_name: fullName.trim() } as any);
      }
      const next = getNextStep(currentStep);
      setStep(next);
      if (next === 'complete') {
        complete();
        onComplete();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    skip();
    onComplete();
  };

  const handleGoToDashboard = () => {
    complete();
    onComplete();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="w-full max-w-lg px-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Step {stepIndex + 1} of {totalSteps}</span>
            <button onClick={handleSkip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              Skip for now
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[320px]">
          {currentStep === 'welcome' && (
            <div className="text-center">
              <img src="/logo.png" alt="MyBudgetOS" className="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain shadow-lg" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome to MyBudgetOS
              </h1>
              <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                Plan. Track. Grow.
              </p>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Your personal financial operating system. Let's get you set up in just a few steps.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {WELCOME_FEATURES.map((feature) => (
                  <div key={feature.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-2xl">{feature.icon}</span>
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Let's personalize your experience. What should we call you?
              </p>
              <div className="mt-6">
                <label htmlFor="onboarding-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  id="onboarding-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {currentStep === 'accounts' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Your First Account</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Start by adding a bank account, credit card, or cash wallet to track your balances.
              </p>
              <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                  <span className="text-3xl">🏦</span>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  You can add accounts from the Accounts page after completing setup.
                </p>
                <button
                  onClick={() => navigate('/accounts')}
                  className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Or add one now →
                </button>
              </div>
            </div>
          )}

          {currentStep === 'budgets' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create a Budget</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Set spending limits for categories like groceries, entertainment, and housing.
              </p>
              <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <span className="text-3xl">📊</span>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  Budgets help you stay on track with your spending goals.
                </p>
                <button
                  onClick={() => navigate('/budgets')}
                  className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Or create one now →
                </button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You're All Set!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                MyBudgetOS is ready to help you take control of your finances.
              </p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Tip:</strong> Complete the setup checklist on your dashboard to unlock all features.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {currentStep !== 'complete' ? (
            <>
              <button
                onClick={handleNext}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {isProcessing ? 'Saving...' : currentStep === 'welcome' ? 'Get Started' : 'Continue'}
              </button>
            </>
          ) : (
            <button
              onClick={handleGoToDashboard}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
