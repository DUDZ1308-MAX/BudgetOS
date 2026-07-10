/**
 * Typed error system for the Financial Engine.
 * Every function returns a result object, NEVER throws.
 */

export type EngineErrorCode =
  | 'NEGATIVE_PRINCIPAL'
  | 'INVALID_RATE'
  | 'TERM_TOO_LONG'
  | 'TERM_TOO_SHORT'
  | 'AMOUNT_OVERFLOW'
  | 'DATE_MISMATCH'
  | 'DIVISION_BY_ZERO'
  | 'INVALID_INPUT'
  | 'INVALID_EXTRA_PAYMENT'
  | 'NEGATIVE_BALANCE'
  | 'MISSING_REQUIRED_FIELD'
  | 'UNEXPECTED_ERROR';

export interface EngineError {
  code: EngineErrorCode;
  message: string;
  recoverable: boolean;
}

export function engineError(
  code: EngineErrorCode,
  message: string,
  recoverable = false,
): EngineError {
  return { code, message, recoverable };
}

export type EngineResult<T> =
  | { success: true; data: T }
  | { success: false; error: EngineError };

export function success<T>(data: T): EngineResult<T> {
  return { success: true, data };
}

export function failure<T>(error: EngineError): EngineResult<T> {
  return { success: false, error };
}

/** Validate mortgage input parameters */
export function validateMortgageInput(
  principal: number,
  annualRate: number,
  termYears: number,
): EngineError | null {
  if (principal <= 0) {
    return engineError('NEGATIVE_PRINCIPAL', 'Principal must be greater than 0');
  }
  if (annualRate < 0 || annualRate > 100) {
    return engineError('INVALID_RATE', 'Annual rate must be between 0 and 100');
  }
  if (termYears < 1) {
    return engineError('TERM_TOO_SHORT', 'Term must be at least 1 year');
  }
  if (termYears > 50) {
    return engineError('TERM_TOO_LONG', 'Term must not exceed 50 years');
  }
  return null;
}
