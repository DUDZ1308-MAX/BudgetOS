export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

export interface LoggerTransport {
  log(entry: LogEntry): void;
}

class ConsoleTransport implements LoggerTransport {
  log(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`;
    switch (entry.level) {
      case 'debug':
        if (import.meta.env.DEV) console.debug(prefix, entry.message, entry.data ?? '');
        break;
      case 'info':
        if (import.meta.env.DEV) console.info(prefix, entry.message, entry.data ?? '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data ?? '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.error ?? entry.data ?? '');
        break;
    }
  }
}

class Logger {
  private transports: LoggerTransport[] = [new ConsoleTransport()];
  private history: LogEntry[] = [];
  private maxHistory = 200;

  addTransport(transport: LoggerTransport): void {
    this.transports.push(transport);
  }

  private log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>, error?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error: error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error,
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch { /* transport failure must not break logging */ }
    }
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, error?: unknown, data?: Record<string, unknown>): void {
    this.log('error', message, context, data, error);
  }

  getHistory(): LogEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const logger = new Logger();
