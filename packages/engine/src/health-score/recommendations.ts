import type { FHSResult } from './types';

export function formatRecommendations(result: FHSResult): string[] {
  return result.recommendations.map((rec, i) => `${i + 1}. ${rec}`);
}

export function getTopRecommendation(result: FHSResult): string {
  if (result.recommendations.length === 0) {
    return 'Great job! Your financial health is in good shape.';
  }
  return result.recommendations[0] ?? '';
}
