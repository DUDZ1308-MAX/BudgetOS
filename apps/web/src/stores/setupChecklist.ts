import { create } from 'zustand';

export type ChecklistItem =
  | 'add_account'
  | 'add_transaction'
  | 'create_budget'
  | 'set_savings_goal'
  | 'add_mortgage'
  | 'try_ai_copilot'
  | 'explore_reports';

interface SetupChecklistState {
  completed: ChecklistItem[];
  isDismissed: boolean;
  complete: (item: ChecklistItem) => void;
  dismiss: () => void;
  isComplete: (item: ChecklistItem) => boolean;
}

function loadState(): { completed: ChecklistItem[]; isDismissed: boolean } {
  try {
    const raw = localStorage.getItem('budgetos_setup_checklist');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completed: [], isDismissed: false };
}

function saveState(state: { completed: ChecklistItem[]; isDismissed: boolean }) {
  try {
    localStorage.setItem('budgetos_setup_checklist', JSON.stringify(state));
  } catch { /* ignore */ }
}

const initial = loadState();

export const useSetupChecklistStore = create<SetupChecklistState>((set, get) => ({
  completed: initial.completed,
  isDismissed: initial.isDismissed,

  complete: (item) => {
    const { completed } = get();
    if (completed.includes(item)) return;
    const next = [...completed, item];
    saveState({ completed: next, isDismissed: get().isDismissed });
    set({ completed: next });
  },

  dismiss: () => {
    saveState({ completed: get().completed, isDismissed: true });
    set({ isDismissed: true });
  },

  isComplete: (item) => get().completed.includes(item),
}));
