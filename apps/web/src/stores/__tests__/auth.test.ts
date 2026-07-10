import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it('starts with no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets user on setUser', () => {
    const user = { id: '123', email: 'test@test.com' } as any;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('clears user on signOut', async () => {
    useAuthStore.setState({ user: { id: '123', email: 'test@test.com' } as any });
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
