import nodemailer from 'nodemailer';
import { defineSecret } from 'firebase-functions/params';

// Gmail SMTP credentials, stored as Cloud Functions secrets (never checked
// into source). Set them once with:
//   firebase functions:secrets:set GMAIL_USER
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
// GMAIL_APP_PASSWORD is a 16-character Google "App Password", not your
// regular Gmail password — see the README for how to generate one.
export const GMAIL_USER = defineSecret('GMAIL_USER');
export const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER.value(),
      pass: GMAIL_APP_PASSWORD.value(),
    },
  });
  return cachedTransporter;
}

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends one email via Gmail SMTP. Failures are logged and swallowed rather
 * than thrown — a notification email failing to send should never fail the
 * Firestore write that triggered it.
 */
export async function sendMail({ to, subject, html }: MailMessage): Promise<void> {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    await getTransporter().sendMail({
      from: `"Barnoota Campus" <${GMAIL_USER.value()}>`,
      to: recipients.join(','),
      subject,
      html,
    });
  } catch (err) {
    console.error(`Failed to send email "${subject}" to ${recipients.join(', ')}:`, err);
  }
}

export function emailLayout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <div style="background: #349563; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <p style="margin: 0; color: #fff; font-size: 16px; font-weight: 700;">Barnoota Campus</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <h1 style="font-size: 18px; margin: 0 0 12px;">${title}</h1>
        ${bodyHtml}
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
          This is an automated notification from your school's Barnoota Campus portal.
        </p>
      </div>
    </div>
  `;
}
