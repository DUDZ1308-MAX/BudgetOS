import { create } from 'zustand';
import { logger } from '@/core/logger';

export type FeedbackType = 'bug' | 'feature' | 'ai-rating' | 'general';

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  screenshot?: string;
  metadata: {
    appVersion: string;
    browser: string;
    os: string;
    route: string;
    aiResponseId?: string;
    aiRating?: number;
  };
  createdAt: string;
  status: 'new' | 'reviewed' | 'actioned';
}

interface FeedbackState {
  entries: FeedbackEntry[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  submit: (entry: Omit<FeedbackEntry, 'id' | 'createdAt' | 'status'>) => void;
  submitFeedbackAsync: (entry: Omit<FeedbackEntry, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  markReviewed: (id: string) => void;
  clearSubmitted: () => void;
  entriesByStatus: Record<FeedbackState['entries'][number]['status'], FeedbackEntry[]>;
}

function loadEntries(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem('budgetos_feedback');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: FeedbackEntry[]) {
  localStorage.setItem('budgetos_feedback', JSON.stringify(entries));
}

let feedbackCounter = 0;

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  entries: loadEntries(),
  isOpen: false,
  entriesByStatus: { new: [], reviewed: [], actioned: [] },

  setOpen: (open) => set({ isOpen: open }),

  submit: (entry) => {
    const newEntry: FeedbackEntry = {
      ...entry,
      id: `fb-${++feedbackCounter}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    const entries = [newEntry, ...get().entries];
    saveEntries(entries);
    set({ entries });
  },

  submitFeedbackAsync: async (entry) => {
    const newEntry: FeedbackEntry = {
      ...entry,
      id: `fb-${++feedbackCounter}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    const entries = [newEntry, ...get().entries];
    saveEntries(entries);
    set({ entries });
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (!response.ok) {
        logger.warn('Failed to sync feedback to server', 'FeedbackStore', { status: response.status });
      }
    } catch (err) {
      logger.warn('Failed to sync feedback to server', 'FeedbackStore', { error: String(err) });
    }
  },

  markReviewed: (id) => {
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, status: 'reviewed' as const } : e,
    );
    saveEntries(entries);
    set({ entries });
  },

  clearSubmitted: () => {
    localStorage.removeItem('budgetos_feedback');
    set({ entries: [] });
  },
}));
