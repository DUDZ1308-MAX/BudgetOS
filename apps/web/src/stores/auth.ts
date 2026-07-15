import { create } from 'zustand';
import type { User, Subscription } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/stores/profile';
import { logger } from '@/core/logger';

let authSubscription: Subscription | null = null;

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  initialize: async () => {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      set({ user: sessionUser, isLoading: false });
      if (sessionUser) {
        useProfileStore.getState().fetchProfile(sessionUser.id);
      }

      const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        set({ user: u });
        if (u) {
          useProfileStore.getState().fetchProfile(u.id);
        } else {
          useProfileStore.getState().signOut();
        }
      });
      authSubscription = subscriptionData.subscription;
    } catch (err) {
      logger.error('Auth initialize failed', 'Auth', err);
      set({ user: null, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logger.error('Auth signIn error', 'Auth', undefined, { message: error.message });
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      logger.error('Auth signIn threw', 'Auth', err);
      return { error: message };
    }
  },

  signUp: async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        logger.error('Auth signUp error', 'Auth', undefined, { message: error.message });
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      logger.error('Auth signUp threw', 'Auth', err);
      return { error: message };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('Auth signOut threw', 'Auth', err);
    }
    set({ user: null });
    useProfileStore.getState().signOut();
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) {
        logger.error('Auth resetPassword error', 'Auth', undefined, { message: error.message });
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      logger.error('Auth resetPassword threw', 'Auth', err);
      return { error: message };
    }
  },
}));
