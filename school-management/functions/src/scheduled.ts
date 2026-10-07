import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { GMAIL_USER, GMAIL_APP_PASSWORD, sendMail, emailLayout } from './mailer.js';
import { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, sendWhatsAppToMany } from './whatsapp.js';
import { TELEGRAM_BOT_TOKEN, sendTelegramToMany } from './telegram.js';
import { guardianForStudent, telegramChatIdsForStudent } from './recipients.js';

const NOTIFICATION_SECRETS = [GMAIL_USER, GMAIL_APP_PASSWORD, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, TELEGRAM_BOT_TOKEN];

function escapeHtml(input: string): string {
  return String(input ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Notifies the guardian of every student whose fee invoice falls due in
 * exactly 3 days — early enough to act on, and queried on a single
 * equality filter (dueDate) so it needs no composite Firestore index.
 * Invoices already due or overdue are left to the admin to chase manually;
 * this is a heads-up, not a dunning system.
 */
export const sendFeeDueReminders = onSchedule(
  { schedule: 'every day 08:00', timeZone: 'America/New_York', secrets: NOTIFICATION_SECRETS },
  async () => {
    const db = getFirestore();
    const targetDate = daysAgoStr(-3);
    const snap = await db.collection('feeInvoices').where('dueDate', '==', targetDate).get();

    const invoices = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as { id: string; studentId: string; amount: number; amountPaid: number; discount: number; status: string });
    const due = invoices.filter((inv) => inv.status !== 'paid');

    await Promise.all(due.map(async (inv) => {
      const [guardian, telegramChatIds] = await Promise.all([
        guardianForStudent(inv.studentId),
        telegramChatIdsForStudent(inv.studentId),
      ]);
      if (!guardian) return;

      const balance = inv.amount - inv.discount - inv.amountPaid;
      const text = `💳 Reminder: a fee of $${balance.toLocaleString()} for ${guardian.studentName} is due on ${targetDate}.`;
      await Promise.all([
        guardian.email && sendMail({
          to: guardian.email,
          subject: `Fee due in 3 days for ${guardian.studentName}`,
          html: emailLayout('Fee due soon', `
            <p>A fee of <strong>$${balance.toLocaleString()}</strong> for <strong>${escapeHtml(guardian.studentName)}</strong> is due on ${escapeHtml(targetDate)}.</p>
          `),
        }),
        guardian.phone && sendWhatsAppToMany([guardian.phone], text),
        telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
      ]);
    }));
  },
);

/**
 * Weekly check: for every active student, looks at the last 14 days of
 * attendance and alerts the guardian if they were present less than 75% of
 * the days actually marked (so a student with only one or two records
 * isn't flagged off a tiny sample). Runs on single-field queries only
 * (students.status, attendance.studentId) — the date-range filter and the
 * rate calculation both happen in memory — so it needs no composite index.
 */
export const sendLowAttendanceAlerts = onSchedule(
  { schedule: 'every monday 07:00', timeZone: 'America/New_York', secrets: NOTIFICATION_SECRETS },
  async () => {
    const db = getFirestore();
    const cutoff = daysAgoStr(14);

    const studentsSnap = await db.collection('students').where('status', '==', 'active').get();

    await Promise.all(studentsSnap.docs.map(async (studentDoc) => {
      const studentId = studentDoc.id;
      const attSnap = await db.collection('attendance').where('studentId', '==', studentId).get();
      const recent = attSnap.docs
        .map((d) => d.data() as { date: string; status: string })
        .filter((r) => r.date >= cutoff);
      if (recent.length < 3) return; // too few records to mean anything

      const presentCount = recent.filter((r) => r.status === 'present').length;
      const rate = presentCount / recent.length;
      if (rate >= 0.75) return;

      const [guardian, telegramChatIds] = await Promise.all([
        guardianForStudent(studentId),
        telegramChatIdsForStudent(studentId),
      ]);
      if (!guardian) return;

      const pct = Math.round(rate * 100);
      const text = `📉 Attendance alert: ${guardian.studentName} was present only ${pct}% of school days over the last 2 weeks.`;
      await Promise.all([
        guardian.email && sendMail({
          to: guardian.email,
          subject: `Attendance alert for ${guardian.studentName}`,
          html: emailLayout('Low attendance', `
            <p><strong>${escapeHtml(guardian.studentName)}</strong> was present only <strong>${pct}%</strong> of school days over the last 2 weeks.</p>
            <p style="color:#64748b; font-size: 13px;">Please reach out to the school if there's something going on.</p>
          `),
        }),
        guardian.phone && sendWhatsAppToMany([guardian.phone], text),
        telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
      ]);
    }));
  },
);

/**
 * Daily cleanup: deletes any parent-invite link that's still "pending"
 * (never claimed) 7+ days after it was created, so a stale link an admin
 * forgot about can't be claimed months later. Used invites are untouched.
 * Single-field query (status) only, same reasoning as above.
 */
export const cleanupExpiredInvites = onSchedule(
  { schedule: 'every day 03:00', timeZone: 'America/New_York' },
  async () => {
    const db = getFirestore();
    const cutoff = daysAgoStr(7);

    const snap = await db.collection('parentInvites').where('status', '==', 'pending').get();
    const expired = snap.docs.filter((d) => (d.data() as { createdAt: string }).createdAt.slice(0, 10) <= cutoff);
    if (expired.length === 0) return;

    const batch = db.batch();
    expired.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },
);
