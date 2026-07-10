import { create } from 'zustand';

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string;
  joinedAt: string;
  inviteCode?: string;
  status: 'pending' | 'invited' | 'approved' | 'registered';
}

interface WaitlistState {
  entries: WaitlistEntry[];
  currentEntry: WaitlistEntry | null;
  inviteCode: string | null;
  isValidating: boolean;
  join: (email: string, name: string) => Promise<{ success: boolean; message: string }>;
  redeemInvite: (code: string) => Promise<{ success: boolean; message: string }>;
  approveEntry: (id: string) => void;
  generateInviteCode: () => string;
}

let waitlistCounter = 0;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadEntries(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem('budgetos_waitlist');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: WaitlistEntry[]) {
  localStorage.setItem('budgetos_waitlist', JSON.stringify(entries));
}

export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  entries: loadEntries(),
  currentEntry: null,
  inviteCode: null,
  isValidating: false,

  join: async (email, name) => {
    const existing = get().entries.find((e) => e.email === email);
    if (existing) {
      return { success: false, message: 'This email is already on the waitlist.' };
    }
    const entry: WaitlistEntry = {
      id: `wl-${++waitlistCounter}-${Date.now()}`,
      email,
      name,
      joinedAt: new Date().toISOString(),
      status: 'pending',
    };
    const entries = [...get().entries, entry];
    saveEntries(entries);
    set({ entries, currentEntry: entry });
    return { success: true, message: 'You\'re on the list! We\'ll notify you when it\'s your turn.' };
  },

  redeemInvite: async (code) => {
    const entry = get().entries.find((e) => e.inviteCode === code && e.status === 'invited');
    if (!entry) {
      return { success: false, message: 'Invalid or expired invite code.' };
    }
    const entries = get().entries.map((e) =>
      e.id === entry.id ? { ...e, status: 'approved' as const } : e
    );
    saveEntries(entries);
    set({ entries, inviteCode: code });
    return { success: true, message: 'Invite accepted! You can now create your account.' };
  },

  approveEntry: (id) => {
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, status: 'invited' as const, inviteCode: generateCode() } : e
    );
    saveEntries(entries);
    set({ entries });
  },

  generateInviteCode: () => generateCode(),
}));
