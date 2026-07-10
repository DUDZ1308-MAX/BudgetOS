/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>]/g, '')     // Strip remaining angle brackets
    .trim();
}

/**
 * Sanitize a string for safe display in the UI.
 * Escapes HTML special characters.
 */
export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * Sanitize and validate a monetary amount string.
 */
export function sanitizeAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Sanitize search query - strip dangerous characters but keep search-relevant ones.
 */
export function sanitizeSearch(value: string): string {
  return value.replace(/[<>"'()%;]/g, '').trim();
}
