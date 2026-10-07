import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// Telegram bot token from @BotFather, stored as a Cloud Functions secret:
//   firebase functions:secrets:set TELEGRAM_BOT_TOKEN
// See the README for how to create a bot and get this token — it's free
// and takes about two minutes, no business verification required.
export const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');

/**
 * Sends one Telegram text message to a chat id already linked to a parent's
 * account (see onTelegramWebhook below — unlike WhatsApp, Telegram has no
 * way to message a phone number directly; the parent has to message the
 * bot once first). No-ops quietly if the secret isn't configured.
 */
export async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = TELEGRAM_BOT_TOKEN.value();
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error(`Telegram send to ${chatId} failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error(`Telegram send to ${chatId} threw:`, err);
  }
}

export async function sendTelegramToMany(chatIds: string[], text: string): Promise<void> {
  await Promise.all([...new Set(chatIds.filter(Boolean))].map((id) => sendTelegram(id, text)));
}

/**
 * Webhook Telegram calls on every message sent to the bot. The only message
 * this cares about is "/start <uid>" — the deep link a parent taps from
 * their dashboard (see ParentDashboard's "Connect Telegram" button), which
 * carries their own Firebase Auth uid as the start payload. On receiving
 * it, this links that Telegram chat to that exact parent profile — nothing
 * else the bot receives does anything, by design: there's no need for a
 * conversational bot here, just this one linking step.
 */
export const onTelegramWebhook = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN] },
  async (req, res) => {
    const message = req.body?.message;
    const text: string | undefined = message?.text;
    const chatId: number | undefined = message?.chat?.id;
    if (!text || !chatId) {
      res.status(200).send('ignored');
      return;
    }

    const match = text.match(/^\/start\s+(\S+)$/);
    if (!match) {
      res.status(200).send('ignored');
      return;
    }
    const uid = match[1];

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || (userDoc.data() as { role?: string }).role !== 'parent') {
      await sendTelegram(String(chatId), "This link isn't valid — open it from your parent dashboard instead.");
      res.status(200).send('ignored');
      return;
    }

    await userDoc.ref.update({ telegramChatId: String(chatId) });
    await sendTelegram(String(chatId), "You're connected! You'll get updates here from now on.");
    res.status(200).send('ok');
  },
);
