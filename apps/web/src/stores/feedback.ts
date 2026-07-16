import { create } from 'zustand';
import type { Feedback, FeedbackInsert, FeedbackType } from '@budgetos/database';

export type { FeedbackType };

export interface FeedbackEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'new' | 'reviewed' | 'resolved';
  metadata: {
    appVersion: string;
    browser: string;
    os: string;
    route: string;
  };
  createdAt: string;
}

interface FeedbackSubmitPayload {
  type: FeedbackType;
  title: string;
  description: string;
  screenshot?: string;
  metadata: {
    appVersion: string;
    browser: string;
    os: string;
    route: string;
  };
}

interface FeedbackState {
  feedback: Feedback[];
  entries: FeedbackEntry[];
  isLoading: boolean;
  error: string | null;
  selectedType: FeedbackType | null;
  isOpen: boolean;
  setFeedback: (feedback: Feedback[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedType: (type: FeedbackType | null) => void;
  addFeedback: (item: Feedback) => void;
  updateFeedbackItem: (id: string, updates: Partial<Feedback>) => void;
  removeFeedback: (id: string) => void;
  setOpen: (open: boolean) => void;
  submit: (payload: FeedbackSubmitPayload) => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  entries: [],
  isLoading: false,
  error: null,
  selectedType: null,
  isOpen: false,
  setFeedback: (feedback) => set({ feedback }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedType: (selectedType) => set({ selectedType }),
  addFeedback: (item) => set((state) => ({ feedback: [item, ...state.feedback] })),
  updateFeedbackItem: (id, updates) =>
    set((state) => ({
      feedback: state.feedback.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  removeFeedback: (id) =>
    set((state) => ({
      feedback: state.feedback.filter((f) => f.id !== id),
    })),
  setOpen: (isOpen) => set({ isOpen }),
  submit: (payload) => {
    const entry: FeedbackEntry = {
      id: `fb_${Date.now()}`,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      status: 'new',
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ entries: [entry, ...state.entries] }));
  },
}));
