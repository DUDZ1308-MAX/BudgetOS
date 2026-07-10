export type SchedulerState = 'idle' | 'running' | 'paused';

export class SyncScheduler {
  private interval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private state: SchedulerState = 'idle';
  private syncFn: (() => Promise<void>) | null = null;
  private online: boolean = navigator.onLine;

  constructor(intervalMs: number = 300000) {
    this.interval = intervalMs;
    this.online = navigator.onLine;

    window.addEventListener('online', () => {
      this.online = true;
      if (this.state === 'running') this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.online = false;
    });
  }

  setSyncFn(fn: () => Promise<void>): void {
    this.syncFn = fn;
  }

  setInterval(ms: number): void {
    this.interval = ms;
    if (this.state === 'running') {
      this.stop();
      this.start();
    }
  }

  getInterval(): number {
    return this.interval;
  }

  start(): void {
    if (this.state === 'running' || !this.syncFn) return;
    this.state = 'running';
    this.scheduleTimer();
    if (import.meta.env.DEV) console.debug('[SyncScheduler] Started');
  }

  stop(): void {
    if (this.state === 'idle') return;
    this.clearTimer();
    this.state = 'idle';
    if (import.meta.env.DEV) console.debug('[SyncScheduler] Stopped');
  }

  pause(): void {
    if (this.state !== 'running') return;
    this.clearTimer();
    this.state = 'paused';
    if (import.meta.env.DEV) console.debug('[SyncScheduler] Paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.scheduleTimer();
    if (import.meta.env.DEV) console.debug('[SyncScheduler] Resumed');
  }

  triggerSync(): void {
    if (!this.syncFn || !this.online) return;
    this.syncFn().catch(() => {});
  }

  isOnline(): boolean {
    return this.online;
  }

  getState(): SchedulerState {
    return this.state;
  }

  private scheduleTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.triggerSync();
    }, this.interval);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  destroy(): void {
    this.stop();
    this.syncFn = null;
  }
}
