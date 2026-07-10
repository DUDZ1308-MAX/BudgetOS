import { create } from 'zustand';
import type { User, Subscription } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/stores/profile';

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
      console.error('[Auth] initialize failed', err);
      set({ user: null, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Auth] signIn error', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      console.error('[Auth] signIn threw', err);
      return { error: message };
    }
  },

  signUp: async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('[Auth] signUp error', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      console.error('[Auth] signUp threw', err);
      return { error: message };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] signOut threw', err);
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
        console.error('[Auth] resetPassword error', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      console.error('[Auth] resetPassword threw', err);
      return { error: message };
    }
  },
}));
