/**
 * Firebase errors carry a stable `.code` (e.g. "auth/email-already-in-use")
 * separate from their `.message`, which is often written for developers
 * rather than end users. Map the common ones to plain language; fall back
 * to the raw message for anything unrecognized rather than hiding it.
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'That email address doesn\'t look valid.',
  'auth/weak-password': 'That password is too weak.',
  'auth/password-does-not-meet-requirements': 'The generated password didn\'t meet this project\'s password policy. Try again, or contact support if this keeps happening.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'permission-denied': 'You don\'t have permission to do that.',
  'unavailable': 'The server is temporarily unavailable. Please try again.',
};

export function friendlyErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code);
    if (FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code];
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
