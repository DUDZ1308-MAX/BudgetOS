import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '..';
import type { LoggerTransport, LogEntry } from '..';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearHistory();
  });

  it('logs debug messages without throwing', () => {
    expect(() => logger.debug('test debug', 'test')).not.toThrow();
  });

  it('logs info messages without throwing', () => {
    expect(() => logger.info('test info', 'test')).not.toThrow();
  });

  it('logs warn messages without throwing', () => {
    expect(() => logger.warn('test warn', 'test')).not.toThrow();
  });

  it('logs error messages without throwing', () => {
    expect(() => logger.error('test error', 'test', new Error('err'))).not.toThrow();
  });

  it('accumulates history', () => {
    logger.info('msg1', 'ctx');
    logger.warn('msg2', 'ctx');
    expect(logger.getHistory().length).toBe(2);
  });

  it('clears history', () => {
    logger.info('msg', 'ctx');
    logger.clearHistory();
    expect(logger.getHistory().length).toBe(0);
  });

  it('calls custom transport', () => {
    const transport: LoggerTransport = {
      log: vi.fn(),
    };
    logger.addTransport(transport);
    logger.info('test', 'ctx');
    expect(transport.log).toHaveBeenCalledTimes(1);
    const entry = (transport.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as LogEntry;
    expect(entry.message).toBe('test');
    expect(entry.level).toBe('info');
  });
});
