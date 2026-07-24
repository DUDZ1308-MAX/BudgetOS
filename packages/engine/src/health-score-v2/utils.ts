import type { LetterGrade, TrendDirection } from '@budgetos/shared';
import { LETTER_GRADE_THRESHOLDS, TREND_THRESHOLDS } from '@budgetos/shared';

export function computeGrade(score: number): LetterGrade {
  if (score >= LETTER_GRADE_THRESHOLDS.A_MIN) return 'A';
  if (score >= LETTER_GRADE_THRESHOLDS.B_MIN) return 'B';
  if (score >= LETTER_GRADE_THRESHOLDS.C_MIN) return 'C';
  if (score >= LETTER_GRADE_THRESHOLDS.D_MIN) return 'D';
  return 'F';
}

export function computeTrend(history: number[]): TrendDirection {
  if (history.length < 2) return 'stable';
  const first = history[0]!;
  const last = history[history.length - 1]!;
  if (first === 0) return last > 0 ? 'improving' : 'stable';
  const changePct = ((last - first) / Math.abs(first)) * 100;
  if (changePct >= TREND_THRESHOLDS.IMPROVING_PCT) return 'improving';
  if (changePct <= TREND_THRESHOLDS.DECLINING_PCT) return 'declining';
  return 'stable';
}

export function computeLetterGrade(overallScore: number): LetterGrade {
  return computeGrade(overallScore);
}
