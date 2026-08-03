import { describe, it, expect } from 'vitest';
import { buildCoachSystemPrompt, buildCoachUserPrompt } from '../prompt';
import { buildCoachContext } from '../context';
import { makeSnapshot } from './fixtures';
import type { CoachRequest } from '../types';

function makeRequest(overrides?: Partial<CoachRequest>): CoachRequest {
  const context = buildCoachContext(makeSnapshot(), 'forecast');
  return {
    intent: 'forecast',
    context,
    scenario: null,
    unavailableSources: [],
    userMessage: 'Will I run out of money in 60 days?',
    ...overrides,
  };
}

describe('coach prompt contract (Phase 5 + 6)', () => {
  it('contains the accuracy rules in the system prompt', () => {
    const system = buildCoachSystemPrompt(makeRequest().context, []);
    expect(system).toContain('NEVER invent');
    expect(system).toContain('Actual');
    expect(system).toContain('Projected');
    expect(system).toContain('Estimated');
    expect(system).toContain('UNAVAILABLE DATA SOURCES');
  });

  it('serializes authoritative figures from the tiered context', () => {
    const system = buildCoachSystemPrompt(makeRequest().context, []);
    expect(system).toContain('$25,000'); // net worth
    expect(system).toContain('$5,000'); // monthly income
    expect(system).toContain('$3,500'); // monthly expenses
    expect(system).toContain('$4,500'); // available cash
  });

  it('lists unavailable sources so the model will not guess', () => {
    const system = buildCoachSystemPrompt(makeRequest().context, ['historical']);
    expect(system).toContain('historical');
  });

  it('injects the engine-computed scenario verbatim and asks not to recompute', () => {
    const request = makeRequest({
      scenario: {
        parsed: { type: 'savings', extraAmount: 100 },
        label: 'Save an extra $100/mo',
        savings: {
          baseline: { projectedBalance: 9500, projectedCompletionDate: '2029-11-01', onTrack: false },
          scenario: { projectedBalance: 10100, projectedCompletionDate: '2028-08-01', onTrack: true },
          monthsSaved: 15,
        },
      },
    });
    const user = buildCoachUserPrompt(request);
    expect(user).toContain('Save an extra $100/mo');
    expect(user).toContain('do not recompute');
    expect(user).toContain('$10,100');
  });

  it('includes the user question and detected intent', () => {
    const request = makeRequest();
    const user = buildCoachUserPrompt(request);
    expect(user).toContain('Will I run out of money in 60 days?');
    expect(user).toContain('forecast');
  });
});
