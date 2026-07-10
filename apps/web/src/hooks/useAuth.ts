import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const { user, isLoading, signIn, signUp, signOut, resetPassword } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return { user, isLoading, signIn, signUp, signOut, resetPassword };
}
