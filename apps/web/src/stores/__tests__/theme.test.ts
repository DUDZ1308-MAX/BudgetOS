import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../theme';

describe('ThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'mybudgetos-dark' });
  });

  it('defaults to mybudgetos-dark', () => {
    expect(useThemeStore.getState().theme).toBe('mybudgetos-dark');
  });

  it('toggles to light', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggles back to dark', () => {
    useThemeStore.getState().toggle();
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('mybudgetos-dark');
  });

  it('sets specific theme', () => {
    useThemeStore.getState().setTheme('midnight-blue');
    expect(useThemeStore.getState().theme).toBe('midnight-blue');
  });

  it('sets forest theme', () => {
    useThemeStore.getState().setTheme('forest');
    expect(useThemeStore.getState().theme).toBe('forest');
  });

  it('sets slate theme', () => {
    useThemeStore.getState().setTheme('slate');
    expect(useThemeStore.getState().theme).toBe('slate');
  });

  it('sets light theme', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
