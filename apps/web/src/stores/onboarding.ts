import { create } from 'zustand';

export type OnboardingStep =
  | 'welcome'
  | 'create-budget'
  | 'add-income'
  | 'add-expenses'
  | 'savings-goal'
  | 'explore-ai'
  | 'enable-sync'
  | 'complete';

interface OnboardingState {
  isActive: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isDismissed: boolean;
  start: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  skip: () => void;
  complete: () => void;
  dismiss: () => void;
}

const stepsOrder: OnboardingStep[] = [
  'welcome',
  'create-budget',
  'add-income',
  'add-expenses',
  'savings-goal',
  'explore-ai',
  'enable-sync',
  'complete',
];

function loadDismissed(): boolean {
  try {
    return localStorage.getItem('budgetos_onboarding_dismissed') === 'true';
  } catch { return false; }
}

function saveDismissed() {
  localStorage.setItem('budgetos_onboarding_dismissed', 'true');
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isActive: false,
  currentStep: 'welcome',
  completedSteps: [],
  isDismissed: loadDismissed(),

  start: () => {
    if (get().isDismissed) return;
    set({ isActive: true, currentStep: 'welcome', completedSteps: [] });
  },

  nextStep: () => {
    const { currentStep, completedSteps } = get();
    const currentIndex = stepsOrder.indexOf(currentStep);
    if (currentIndex < stepsOrder.length - 1) {
      const next = stepsOrder[currentIndex + 1];
      set({
        currentStep: next,
        completedSteps: [...completedSteps, currentStep],
      });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = stepsOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepsOrder[currentIndex - 1] });
    }
  },

  goToStep: (step) => set({ currentStep: step }),

  skip: () => {
    saveDismissed();
    set({ isActive: false, isDismissed: true });
  },

  complete: () => {
    saveDismissed();
    set({ isActive: false, isDismissed: true, completedSteps: [...stepsOrder] });
  },

  dismiss: () => {
    saveDismissed();
    set({ isDismissed: true });
  },
}));
