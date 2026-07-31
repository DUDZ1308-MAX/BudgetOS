const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AUTH_REQUIRED_MESSAGE = 'Authentication required';
export const INVALID_USER_ID_MESSAGE = 'Invalid user id';

export function isValidUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function requireUserId(userId: string | null | undefined): string {
  if (userId === null || userId === undefined || userId.trim() === '') {
    throw new Error(AUTH_REQUIRED_MESSAGE);
  }
  if (!isValidUuid(userId)) {
    throw new Error(INVALID_USER_ID_MESSAGE);
  }
  return userId;
}

export function isAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === AUTH_REQUIRED_MESSAGE || error.message === INVALID_USER_ID_MESSAGE)
  );
}
