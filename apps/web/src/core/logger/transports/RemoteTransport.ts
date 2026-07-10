import type { LoggerTransport, LogEntry } from '..';

interface RemoteTransportOptions {
  endpoint: string;
  batchSize?: number;
  flushInterval?: number;
}

export class RemoteTransport implements LoggerTransport {
  private buffer: LogEntry[] = [];
  private options: Required<RemoteTransportOptions>;

  constructor(options: RemoteTransportOptions) {
    this.options = {
      endpoint: options.endpoint,
      batchSize: options.batchSize ?? 10,
      flushInterval: options.flushInterval ?? 5000,
    };
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.options.flushInterval);
    }
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= this.options.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    try {
      await fetch(this.options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: batch, timestamp: new Date().toISOString() }),
        keepalive: true,
      });
    } catch {
      // Silently fail - don't let logging break the app
    }
  }
}
