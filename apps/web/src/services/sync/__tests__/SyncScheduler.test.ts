import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncScheduler } from '../SyncScheduler';

describe('SyncScheduler', () => {
  let scheduler: SyncScheduler;
  let syncFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    syncFn = vi.fn().mockResolvedValue(undefined);
    scheduler = new SyncScheduler(10000);
    scheduler.setSyncFn(syncFn);
  });

  afterEach(() => {
    scheduler.destroy();
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    expect(scheduler.getState()).toBe('idle');
  });

  it('starts and runs sync on interval', () => {
    scheduler.start();
    expect(scheduler.getState()).toBe('running');

    vi.advanceTimersByTime(10000);
    expect(syncFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10000);
    expect(syncFn).toHaveBeenCalledTimes(2);
  });

  it('stops the interval', () => {
    scheduler.start();
    scheduler.stop();
    expect(scheduler.getState()).toBe('idle');

    vi.advanceTimersByTime(10000);
    expect(syncFn).not.toHaveBeenCalled();
  });

  it('pauses and resumes', () => {
    scheduler.start();
    scheduler.pause();
    expect(scheduler.getState()).toBe('paused');

    vi.advanceTimersByTime(10000);
    expect(syncFn).not.toHaveBeenCalled();

    scheduler.resume();
    expect(scheduler.getState()).toBe('running');

    vi.advanceTimersByTime(10000);
    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('triggers sync manually', () => {
    scheduler.start();
    scheduler.triggerSync();
    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('does not trigger sync when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    scheduler = new SyncScheduler(10000);
    scheduler.setSyncFn(syncFn);
    scheduler.start();
    syncFn.mockClear();
    scheduler.triggerSync();
    expect(syncFn).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('sets and gets interval', () => {
    scheduler.setInterval(5000);
    expect(scheduler.getInterval()).toBe(5000);
  });

  it('destroys cleans up', () => {
    scheduler.start();
    scheduler.destroy();
    expect(scheduler.getState()).toBe('idle');
  });
});
