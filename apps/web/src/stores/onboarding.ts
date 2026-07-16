import { create } from 'zustand';

export type OnboardingStep = 'welcome' | 'profile' | 'accounts' | 'budgets' | 'complete';

interface OnboardingState {
  isCompleted: boolean;
  isActive: boolean;
  currentStep: OnboardingStep;
  startedAt: string | null;
  completedAt: string | null;
  start: () => void;
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  complete: () => void;
  reset: () => void;
  skip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = ['welcome', 'profile', 'accounts', 'budgets', 'complete'];

function loadState(): { isCompleted: boolean; startedAt: string | null; completedAt: string | null } {
  try {
    const raw = localStorage.getItem('budgetos_onboarding');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { isCompleted: false, startedAt: null, completedAt: null };
}

function saveState(state: { isCompleted: boolean; startedAt: string | null; completedAt: string | null }) {
  try {
    localStorage.setItem('budgetos_onboarding', JSON.stringify(state));
  } catch { /* ignore */ }
}

const initial = loadState();

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isCompleted: initial.isCompleted,
  isActive: false,
  currentStep: 'welcome',
  startedAt: initial.startedAt,
  completedAt: initial.completedAt,

  start: () => {
    if (get().isCompleted) return;
    const state = get();
    if (!state.startedAt) {
      const startedAt = new Date().toISOString();
      saveState({ ...state, startedAt });
      set({ isActive: true, currentStep: 'welcome', startedAt });
    } else {
      set({ isActive: true });
    }
  },

  setStep: (step) => {
    const state = get();
    if (!state.startedAt) {
      const startedAt = new Date().toISOString();
      saveState({ ...state, startedAt });
      set({ currentStep: step, startedAt });
    } else {
      set({ currentStep: step });
    }
  },

  nextStep: () => {
    const { currentStep } = get();
    const idx = ONBOARDING_STEPS.indexOf(currentStep);
    if (idx < ONBOARDING_STEPS.length - 1) {
      set({ currentStep: ONBOARDING_STEPS[idx + 1] });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const idx = ONBOARDING_STEPS.indexOf(currentStep);
    if (idx > 0) {
      set({ currentStep: ONBOARDING_STEPS[idx - 1] });
    }
  },

  complete: () => {
    const completedAt = new Date().toISOString();
    saveState({ isCompleted: true, startedAt: get().startedAt, completedAt });
    set({ isCompleted: true, isActive: false, completedAt });
  },

  reset: () => {
    saveState({ isCompleted: false, startedAt: null, completedAt: null });
    set({ isCompleted: false, isActive: false, currentStep: 'welcome', startedAt: null, completedAt: null });
  },

  skip: () => {
    const completedAt = new Date().toISOString();
    saveState({ isCompleted: true, startedAt: get().startedAt, completedAt });
    set({ isCompleted: true, isActive: false, currentStep: 'complete', completedAt });
  },
}));

export function getNextStep(current: OnboardingStep): OnboardingStep {
  const idx = ONBOARDING_STEPS.indexOf(current);
  return ONBOARDING_STEPS[Math.min(idx + 1, ONBOARDING_STEPS.length - 1)] ?? 'complete';
}

export function getPrevStep(current: OnboardingStep): OnboardingStep {
  const idx = ONBOARDING_STEPS.indexOf(current);
  return ONBOARDING_STEPS[Math.max(idx - 1, 0)] ?? 'welcome';
}

export function getStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function getTotalSteps(): number {
  return ONBOARDING_STEPS.length;
}
