import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCoachRequest } from '../service';
import { makeSnapshot } from './fixtures';

vi.mock('../snapshot', () => ({
  buildFinancialSnapshot: vi.fn(),
}));

vi.mock('../scenarios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../scenarios')>();
  return { ...actual };
});

import { buildFinancialSnapshot } from '../snapshot';

const mockedSnapshot = vi.mocked(buildFinancialSnapshot);

describe('coach request orchestration (Phase 9)', () => {
  beforeEach(() => {
    mockedSnapshot.mockReset();
    mockedSnapshot.mockResolvedValue(makeSnapshot());
  });

  it('detects intent and builds a tiered context + request', async () => {
    const result = await buildCoachRequest('11111111-2222-3333-4444-555555555555', 'Will my balance hit zero in 60 days?');

    expect(result.request.intent).toBe('forecast');
    expect(result.request.userMessage).toContain('60 days');
    expect(result.request.context.basic).toBeDefined();
    expect(result.request.context.forecast).toBeDefined();
    expect(result.request.scenario).toBeNull();
    expect(result.insights).toEqual([]);
  });

  it('runs a what-if scenario through the engine', async () => {
    const result = await buildCoachRequest(
      '11111111-2222-3333-4444-555555555555',
      'What if I save an extra $100 a month?',
    );

    expect(result.request.intent).toBe('what_if_scenario');
    expect(result.request.scenario).not.toBeNull();
    expect(result.request.scenario?.label).toContain('$100/mo');
    expect(result.request.scenario?.comparison).toBeDefined();
  });

  it('propagates unavailable sources into the request', async () => {
    mockedSnapshot.mockResolvedValue(makeSnapshot({ unavailableSources: ['historical'] }));
    const result = await buildCoachRequest('11111111-2222-3333-4444-555555555555', 'How is my cash flow?');
    expect(result.request.unavailableSources).toContain('historical');
  });

  it('rejects requests without a real authenticated userId', async () => {
    await expect(buildCoachRequest('', 'hello')).rejects.toThrow();
  });
});
