import { describe, it, expect } from 'vitest';
import { formatRecommendations, getTopRecommendation } from '../recommendations';
import type { FHSResult } from '../types';

function makeResult(overrides?: Partial<FHSResult>): FHSResult {
  return {
    score: 0,
    category: 'poor',
    componentScores: [],
    recommendations: [],
    ...overrides,
  };
}

describe('formatRecommendations', () => {
  it('formats recommendations as numbered list', () => {
    const result = makeResult({ recommendations: ['Save more', 'Reduce debt'] });
    const formatted = formatRecommendations(result);
    expect(formatted).toEqual(['1. Save more', '2. Reduce debt']);
  });

  it('returns empty array when no recommendations', () => {
    const result = makeResult({ recommendations: [] });
    expect(formatRecommendations(result)).toEqual([]);
  });
});

describe('getTopRecommendation', () => {
  it('returns first recommendation', () => {
    const result = makeResult({ recommendations: ['Pay down debt', 'Save more'] });
    expect(getTopRecommendation(result)).toBe('Pay down debt');
  });

  it('returns default message when no recommendations', () => {
    const result = makeResult({ recommendations: [] });
    expect(getTopRecommendation(result)).toBe('Great job! Your financial health is in good shape.');
  });
});
