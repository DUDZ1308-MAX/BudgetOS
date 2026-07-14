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
  'create-budget': {
    title: 'Create Your First Budget',
    description: 'Budgets help you track spending and stay on top of your finances. Start simple — pick a category and set a monthly limit. MyBudgetOS will track everything automatically.',
    illustration: <IconChart className="h-16 w-16 text-brand-600" />,
  },
  'add-income': {
    title: 'Add Your Income',
    description: 'Add your salary, freelance income, or any regular deposits. MyBudgetOS will use this to calculate your savings rate and give you better financial insights.',
    illustration: <IconRocket className="h-16 w-16 text-emerald-600" />,
  },
  'add-expenses': {
    title: 'Track Your Expenses',
    description: 'Start recording your spending. Add transactions manually or import from a CSV file. The more data you add, the smarter your AI insights become.',
    illustration: <IconChart className="h-16 w-16 text-amber-600" />,
  },
  'savings-goal': {
    title: 'Set a Savings Goal',
    description: 'Save for something that matters — an emergency fund, a vacation, or a big purchase. Set a target and MyBudgetOS will help you track progress.',
    illustration: <IconTarget className="h-16 w-16 text-brand-600" />,
  },
  'explore-ai': {
    title: 'Meet Your AI Copilot',
    description: 'Your AI Financial Copilot can answer questions about your spending, suggest budget improvements, and provide personalized financial advice. Try asking it anything!',
    illustration: <IconSparkles className="h-16 w-16 text-brand-600" />,
  },
  'enable-sync': {
    title: 'Enable Cloud Sync',
    description: 'Turn on cloud sync to keep your data safe and accessible across all your devices. Your data is encrypted and securely stored.',
    illustration: <IconBadgeCheck className="h-16 w-16 text-emerald-600" />,
  },
  complete: {
    title: 'You\'re All Set!',
    description: 'You\'re ready to take control of your finances. Explore the dashboard, check your financial health score, and use the AI Copilot to optimize your spending.',
    illustration: <IconBadgeCheck className="h-16 w-16 text-emerald-600" />,
  },
};

const stepNames: OnboardingStep[] = [
  'welcome', 'create-budget', 'add-income', 'add-expenses',
  'savings-goal', 'explore-ai', 'enable-sync', 'complete',
];

export function OnboardingWizard() {
  const { isActive, currentStep, nextStep, prevStep, skip, complete, start } = useOnboardingStore();

  const currentIndex = stepNames.indexOf(currentStep);
  const totalSteps = stepNames.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;
  const isLast = currentStep === 'complete';
  const step = STEP_CONFIG[currentStep];

  if (!isActive) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="px-6 pt-6 pb-2">
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
              {stepNames.map((s, i) => (
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
