import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logger } from '@/core/logger';
import type { Theme } from '@/stores/theme';
import { useThemeStore } from '@/stores/theme';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  locale: string;
  onboarding_complete: boolean;
  theme_preference: Theme | null;
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
        logger.error('Profile fetch failed', 'Profile', undefined, { message: error.message });
        return;
      }
      set({ profile: data as Profile | null, isLoading: false });

      // Apply theme from database if available
      if (data && (data as any).theme_preference) {
        useThemeStore.getState().setThemeFromProfile((data as any).theme_preference as Theme);
      }
    } catch (err) {
      logger.error('Profile fetch threw', 'Profile', err);
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
        logger.error('Profile update failed', 'Profile', undefined, { message: error.message });
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) set({ profile: data as Profile });
    } catch (err) {
      logger.error('Profile update threw', 'Profile', err);
    }
  },

  signOut: () => set({ profile: null }),
}));
