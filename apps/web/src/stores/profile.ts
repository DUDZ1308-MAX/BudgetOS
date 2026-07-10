import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  locale: string;
  onboarding_complete: boolean;
}

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<void>;
  signOut: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async (userId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Profile] fetch failed', error.message);
        return;
      }
      set({ profile: data as Profile | null, isLoading: false });
    } catch (err) {
      console.error('[Profile] fetch threw', err);
      set({ isLoading: false });
    }
  },

  updateProfile: async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('[Profile] update failed', error.message);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) set({ profile: data as Profile });
    } catch (err) {
      console.error('[Profile] update threw', err);
    }
  },

  signOut: () => set({ profile: null }),
}));
