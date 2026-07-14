import { create } from 'zustand';

export type AnnouncementType = 'release' | 'maintenance' | 'feature' | 'security';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  createdAt: string;
  expiresAt?: string;
  link?: { label: string; href: string };
}

interface AnnouncementState {
  announcements: Announcement[];
  readIds: string[];
  markRead: (id: string) => void;
  unreadCount: () => number;
}

function loadReadIds(): string[] {
  try {
    const raw = localStorage.getItem('budgetos_announcements_read');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveReadIds(ids: string[]) {
  localStorage.setItem('budgetos_announcements_read', JSON.stringify(ids));
}

const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    type: 'release',
    title: 'Welcome to MyBudgetOS Public Beta',
    body: 'We\'re excited to launch our public beta! Explore the AI Financial Copilot, set savings goals, track budgets, and more. Your feedback helps shape the future of MyBudgetOS.',
    createdAt: '2026-07-09T00:00:00Z',
    link: { label: 'View Release Notes', href: '/release-notes' },
  },
  {
    id: 'ann-2',
    type: 'feature',
    title: 'New: Financial Health Score',
    body: 'Check out your personalized Financial Health Score on the dashboard. Get actionable recommendations to improve your financial well-being.',
    createdAt: '2026-07-08T00:00:00Z',
    link: { label: 'View Health Score', href: '/health' },
  },
];

export const useAnnouncementsStore = create<AnnouncementState>((set, get) => ({
  announcements: defaultAnnouncements,
  readIds: loadReadIds(),

  markRead: (id) => {
    const readIds = [...new Set([...get().readIds, id])];
    saveReadIds(readIds);
    set({ readIds });
  },

  unreadCount: () => {
    const { announcements, readIds } = get();
    return announcements.filter((a) => !readIds.includes(a.id)).length;
  },
}));
