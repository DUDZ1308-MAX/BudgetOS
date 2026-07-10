import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '../toast';

describe('ToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('starts with no toasts', () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('adds a toast', () => {
    useToastStore.getState().addToast('success', 'Test toast');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.type).toBe('success');
    expect(toast.message).toBe('Test toast');
    expect(toast.duration).toBe(4000);
  });

  it('removes a toast', () => {
    useToastStore.getState().addToast('info', 'Test');
    const id = useToastStore.getState().toasts[0]!.id;
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('adds a success toast with 3000ms duration', () => {
    useToastStore.getState().addSuccess('Success!');
    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.type).toBe('success');
    expect(toast.duration).toBe(3000);
  });
});
