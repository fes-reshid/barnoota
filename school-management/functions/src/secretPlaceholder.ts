/**
 * Cloud Functions v2 requires every secret a deployed function references to
 * already exist in Secret Manager — deploying with a secret that's never
 * been set at all fails outright, which would also block deploying the
 * already-working Gmail functions, since every trigger shares one codebase.
 *
 * So optional channels (WhatsApp, Telegram) get this exact placeholder
 * value set via `firebase functions:secrets:set` before their first real
 * deploy, rather than being left unset. Treat it as "not configured yet"
 * and no-op, same as truly-unset would — once a school wants that channel,
 * setting the secret to a real value (same command) is all that's needed.
 */
export const PLACEHOLDER_SECRET_VALUE = 'not-configured-yet';

export function isSecretConfigured(value: string | undefined): value is string {
  return Boolean(value && value !== PLACEHOLDER_SECRET_VALUE);
}
