import type { NavigateFunction } from 'react-router-dom';

export type AuthGate = 'require-auth' | 'require-guest' | 'optional';

export function checkAuthAccess(
  isAuthenticated: boolean,
  isLoading: boolean,
  gate: AuthGate,
  navigate: NavigateFunction,
  from?: string,
): boolean {
  if (isLoading) return false;

  if (gate === 'require-auth' && !isAuthenticated) {
    navigate('/auth/login', { state: from ? { from } : undefined, replace: true });
    return false;
  }

  if (gate === 'require-guest' && isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return false;
  }

  return true;
}

export function getRedirectPath(gate: AuthGate, isAuthenticated: boolean): string | null {
  if (gate === 'require-auth' && !isAuthenticated) return '/auth/login';
  if (gate === 'require-guest' && isAuthenticated) return '/dashboard';
  return null;
}
