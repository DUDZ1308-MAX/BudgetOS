import { describe, it, expect } from 'vitest';
import { getRedirectPath } from '../auth';

describe('auth middleware', () => {
  it('returns login path for unauthenticated user on require-auth', () => {
    expect(getRedirectPath('require-auth', false)).toBe('/auth/login');
  });

  it('returns dashboard path for authenticated user on require-guest', () => {
    expect(getRedirectPath('require-guest', true)).toBe('/dashboard');
  });

  it('returns null for authenticated user on require-auth', () => {
    expect(getRedirectPath('require-auth', true)).toBeNull();
  });

  it('returns null for unauthenticated user on require-guest', () => {
    expect(getRedirectPath('require-guest', false)).toBeNull();
  });

  it('returns null for optional gate', () => {
    expect(getRedirectPath('optional', false)).toBeNull();
    expect(getRedirectPath('optional', true)).toBeNull();
  });
});
