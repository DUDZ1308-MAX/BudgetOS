import { useOnboardingStore, type OnboardingStep } from '@/stores/onboarding';
import { IconRocket, IconTarget, IconSparkles, IconBadgeCheck, IconChart } from '@/components/ui/Icons';

const STEP_CONFIG: Record<OnboardingStep, {
  title: string;
  description: string;
  illustration: React.ReactNode;
}> = {
  welcome: {
    title: 'Welcome to MyBudgetOS',
    description: 'Take control of your finances with smart budgeting, AI-powered insights, and beautiful visualizations. Let\'s get you set up in under 5 minutes.',
    illustration: <IconRocket className="h-16 w-16 text-brand-600" />,
  },
  profile: {
    title: 'Set Up Your Profile',
    description: 'Tell us a bit about yourself so we can personalize your experience. Your profile helps us give you better financial insights and recommendations.',
    illustration: <IconTarget className="h-16 w-16 text-brand-600" />,
  },
  accounts: {
    title: 'Connect Your Accounts',
    description: 'Link your bank accounts, credit cards, or other financial accounts. Your data is encrypted and secure — we never store your login credentials.',
    illustration: <IconSparkles className="h-16 w-16 text-emerald-600" />,
  },
  budgets: {
    title: 'Create Your First Budget',
    description: 'Set up your first budget to start tracking spending. Choose a category and set a monthly limit. MyBudgetOS will track everything automatically.',
    illustration: <IconChart className="h-16 w-16 text-brand-600" />,
  },
  complete: {
    title: 'You\'re All Set!',
    description: 'You\'re ready to take control of your finances. Explore the dashboard, check your financial health score, and use the AI Copilot to optimize your spending.',
    illustration: <IconBadgeCheck className="h-16 w-16 text-emerald-600" />,
  },
};

const STEP_ORDER: OnboardingStep[] = ['welcome', 'profile', 'accounts', 'budgets', 'complete'];

export function OnboardingWizard() {
  const { isActive, currentStep, nextStep, prevStep, skip, complete } = useOnboardingStore();

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;
  const isLast = currentStep === 'complete';
  const step = STEP_CONFIG[currentStep];

  if (!isActive) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2 px-6 pt-5 pb-2">
            <img src="/logo.png" alt="MyBudgetOS" className="h-7 w-7 rounded-lg object-contain" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">MyBudgetOS</span>
          </div>
          <div className="px-6 pt-2 pb-2">
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-1.5 rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="mb-4">{step.illustration}</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">{step.description}</p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <div className="flex gap-1">
              {STEP_ORDER.map((s, i) => (
                <div key={s} className={`h-1.5 w-4 rounded-full transition-colors ${
                  i <= currentIndex ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              ))}
            </div>
            <div className="flex gap-2">
              {!isLast && (
                <button
                  onClick={skip}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Skip
                </button>
              )}
              {currentIndex > 0 && !isLast && (
                <button
                  onClick={prevStep}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? complete : nextStep}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                {isLast ? 'Get Started' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
