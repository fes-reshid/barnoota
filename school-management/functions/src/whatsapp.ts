import { defineSecret } from 'firebase-functions/params';

// WhatsApp Cloud API credentials (Meta's own API, not a paid reseller),
// stored as Cloud Functions secrets. Set them once with:
//   firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
//   firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
// See the README for how to get both from developers.facebook.com.
export const WHATSAPP_ACCESS_TOKEN = defineSecret('WHATSAPP_ACCESS_TOKEN');
export const WHATSAPP_PHONE_NUMBER_ID = defineSecret('WHATSAPP_PHONE_NUMBER_ID');

/** Strips everything but digits, so "+1 (614) 555-0210" becomes "16145550210". */
function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

/**
 * Sends one WhatsApp text message via Meta's Cloud API. Failures are logged
 * and swallowed, never thrown — a notification failing to send should never
 * fail the Firestore write that triggered it, same as email.
 *
 * No-ops quietly if the secrets haven't been configured yet, so schools
 * that haven't set up WhatsApp keep working exactly as before (email-only).
 */
export async function sendWhatsApp(to: string, text: string): Promise<void> {
  const token = WHATSAPP_ACCESS_TOKEN.value();
  const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID.value();
  if (!token || !phoneNumberId) return;

  const phone = normalizePhone(to);
  if (phone.length < 8) return; // too short to be a real number — don't waste an API call

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });
    if (!res.ok) {
      console.error(`WhatsApp send to ${phone} failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error(`WhatsApp send to ${phone} threw:`, err);
  }
}

export async function sendWhatsAppToMany(numbers: string[], text: string): Promise<void> {
  await Promise.all([...new Set(numbers.filter(Boolean))].map((n) => sendWhatsApp(n, text)));
}
