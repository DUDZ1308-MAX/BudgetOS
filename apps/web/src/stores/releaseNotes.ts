import { create } from 'zustand';
import { releaseHistory } from '@/data/releaseHistory';
import type { ReleaseNote } from '@/data/releaseHistory';

interface ReleaseNotesState {
  lastSeenVersion: string | null;
  hasUnseen: () => boolean;
  markSeen: (version: string) => void;
  latestRelease: () => ReleaseNote | null;
  getRelease: (version: string) => ReleaseNote | undefined;
}

function loadLastSeen(): string | null {
  try {
    return localStorage.getItem('budgetos_last_seen_version');
  } catch { return null; }
}

function saveLastSeen(version: string) {
  localStorage.setItem('budgetos_last_seen_version', version);
}

export const useReleaseNotesStore = create<ReleaseNotesState>((set, get) => ({
  lastSeenVersion: loadLastSeen(),

  hasUnseen: () => {
    const lastSeen = get().lastSeenVersion;
    if (!lastSeen) return true;
    const latest = releaseHistory[0];
    return latest ? latest.version !== lastSeen : false;
  },

  markSeen: (version) => {
    saveLastSeen(version);
    set({ lastSeenVersion: version });
  },

  latestRelease: () => releaseHistory[0] ?? null,

  getRelease: (version) => releaseHistory.find((r) => r.version === version),
}));
