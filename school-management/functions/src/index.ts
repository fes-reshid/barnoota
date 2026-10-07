import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { GMAIL_USER, GMAIL_APP_PASSWORD, sendMail, emailLayout } from './mailer.js';
import { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, sendWhatsAppToMany } from './whatsapp.js';
import { TELEGRAM_BOT_TOKEN, sendTelegramToMany } from './telegram.js';
import {
  guardianEmailsForClass, guardianEmailsForSchool, guardianForStudent, teacherEmailsForSchool,
  guardianPhonesForClass, guardianPhonesForSchool, telegramChatIdsForClass, telegramChatIdsForSchool,
  telegramChatIdsForStudent,
} from './recipients.js';

export { onTelegramWebhook } from './telegram.js';

initializeApp();
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, TELEGRAM_BOT_TOKEN],
});

// ---------------------------------------------------------------------------
// Announcements — emailed to whichever audience the announcement targets.
// ---------------------------------------------------------------------------
export const onAnnouncementCreated = onDocumentCreated('announcements/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { schoolId, title, body, audience, classId, authorName } = data as {
    schoolId: string; title: string; body: string; audience: string; classId?: string; authorName: string;
  };

  let recipients: string[] = [];
  let guardianPhones: string[] = [];
  let telegramChatIds: string[] = [];
  if (audience === 'everyone') {
    const [guardians, teachers, phones, chatIds] = await Promise.all([
      guardianEmailsForSchool(schoolId),
      teacherEmailsForSchool(schoolId),
      guardianPhonesForSchool(schoolId),
      telegramChatIdsForSchool(schoolId),
    ]);
    recipients = [...guardians, ...teachers];
    guardianPhones = phones;
    telegramChatIds = chatIds;
  } else if (audience === 'teachers') {
    recipients = await teacherEmailsForSchool(schoolId);
  } else if (audience === 'parents' || audience === 'students') {
    [recipients, guardianPhones, telegramChatIds] = await Promise.all([
      guardianEmailsForSchool(schoolId),
      guardianPhonesForSchool(schoolId),
      telegramChatIdsForSchool(schoolId),
    ]);
  } else if (audience === 'class' && classId) {
    [recipients, guardianPhones, telegramChatIds] = await Promise.all([
      guardianEmailsForClass(schoolId, classId),
      guardianPhonesForClass(schoolId, classId),
      telegramChatIdsForClass(schoolId, classId),
    ]);
  }

  const whatsappText = `📢 ${title}\n\n${body}\n\n— ${authorName}`;
  await Promise.all([
    recipients.length > 0 && sendMail({
      to: recipients,
      subject: `New announcement: ${title}`,
      html: emailLayout(title, `
        <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
        <p style="color:#64748b; font-size: 13px;">— ${escapeHtml(authorName)}</p>
      `),
    }),
    guardianPhones.length > 0 && sendWhatsAppToMany(guardianPhones, whatsappText),
    telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, whatsappText),
  ]);
});

// ---------------------------------------------------------------------------
// Homework — emailed to the guardians of every student in the class.
// ---------------------------------------------------------------------------
export const onHomeworkCreated = onDocumentCreated('homework/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { schoolId, classId, title, description, dueDate } = data as {
    schoolId: string; classId: string; title: string; description: string; dueDate: string;
  };

  const [recipients, guardianPhones, telegramChatIds] = await Promise.all([
    guardianEmailsForClass(schoolId, classId),
    guardianPhonesForClass(schoolId, classId),
    telegramChatIdsForClass(schoolId, classId),
  ]);

  const text = `📝 New homework: ${title}\n\n${description}\n\nDue ${dueDate}`;
  await Promise.all([
    recipients.length > 0 && sendMail({
      to: recipients,
      subject: `New homework assigned: ${title}`,
      html: emailLayout('New homework assigned', `
        <p><strong>${escapeHtml(title)}</strong></p>
        <p>${escapeHtml(description)}</p>
        <p style="color:#64748b; font-size: 13px;">Due ${escapeHtml(dueDate)}</p>
      `),
    }),
    guardianPhones.length > 0 && sendWhatsAppToMany(guardianPhones, text),
    telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
  ]);
});

// ---------------------------------------------------------------------------
// Attendance — emailed to the guardian only when a student is marked absent
// or late (never for "present", and never twice for the same status).
// ---------------------------------------------------------------------------
export const onAttendanceWritten = onDocumentWritten('attendance/{id}', async (event) => {
  const after = event.data?.after?.data();
  if (!after) return; // deleted

  const before = event.data?.before?.data();
  const notifiable = after.status === 'absent' || after.status === 'late';
  const statusChanged = !before || before.status !== after.status;
  if (!notifiable || !statusChanged) return;

  const { studentId, date } = after as { studentId: string; date: string };
  const [guardian, telegramChatIds] = await Promise.all([
    guardianForStudent(studentId),
    telegramChatIdsForStudent(studentId),
  ]);
  if (!guardian) return;

  const noteText = after.note ? `\nNote: ${after.note}` : '';
  const text = `📅 Attendance update: ${guardian.studentName} was marked ${after.status} on ${date}.${noteText}`;
  await Promise.all([
    guardian.email && sendMail({
      to: guardian.email,
      subject: `Attendance update for ${guardian.studentName}`,
      html: emailLayout('Attendance update', `
        <p><strong>${escapeHtml(guardian.studentName)}</strong> was marked <strong>${escapeHtml(after.status)}</strong> on ${escapeHtml(date)}.</p>
        ${after.note ? `<p style="color:#64748b; font-size: 13px;">Note: ${escapeHtml(after.note)}</p>` : ''}
      `),
    }),
    guardian.phone && sendWhatsAppToMany([guardian.phone], text),
    telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
  ]);
});

// ---------------------------------------------------------------------------
// Fees — new invoice assigned, and payment receipts.
// ---------------------------------------------------------------------------
export const onFeeInvoiceCreated = onDocumentCreated('feeInvoices/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { studentId, amount, dueDate } = data as { studentId: string; amount: number; dueDate: string };
  const [guardian, telegramChatIds] = await Promise.all([
    guardianForStudent(studentId),
    telegramChatIdsForStudent(studentId),
  ]);
  if (!guardian) return;

  const text = `💳 New fee invoice for ${guardian.studentName}: $${amount.toLocaleString()}, due ${dueDate}.`;
  await Promise.all([
    guardian.email && sendMail({
      to: guardian.email,
      subject: `New fee invoice for ${guardian.studentName}`,
      html: emailLayout('New fee invoice', `
        <p>A new invoice of <strong>$${amount.toLocaleString()}</strong> has been assigned for <strong>${escapeHtml(guardian.studentName)}</strong>, due ${escapeHtml(dueDate)}.</p>
      `),
    }),
    guardian.phone && sendWhatsAppToMany([guardian.phone], text),
    telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
  ]);
});

export const onPaymentCreated = onDocumentCreated('payments/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { studentId, amount, method, receiptNumber } = data as {
    studentId: string; amount: number; method: string; receiptNumber: string;
  };
  const [guardian, telegramChatIds] = await Promise.all([
    guardianForStudent(studentId),
    telegramChatIdsForStudent(studentId),
  ]);
  if (!guardian) return;

  const text = `✅ Payment received for ${guardian.studentName}: $${amount.toLocaleString()} via ${method.replace('_', ' ')}. Receipt: ${receiptNumber}`;
  await Promise.all([
    guardian.email && sendMail({
      to: guardian.email,
      subject: `Payment received — receipt ${receiptNumber}`,
      html: emailLayout('Payment received', `
        <p>We've received a payment of <strong>$${amount.toLocaleString()}</strong> for <strong>${escapeHtml(guardian.studentName)}</strong> via ${escapeHtml(method.replace('_', ' '))}.</p>
        <p style="color:#64748b; font-size: 13px;">Receipt: ${escapeHtml(receiptNumber)}</p>
      `),
    }),
    guardian.phone && sendWhatsAppToMany([guardian.phone], text),
    telegramChatIds.length > 0 && sendTelegramToMany(telegramChatIds, text),
  ]);
});

// ---------------------------------------------------------------------------
// Direct messages — emailed to every other participant in the thread, using
// the email already on their user profile (participantIds are Firebase Auth
// uids, i.e. users/{uid} documents).
// ---------------------------------------------------------------------------
export const onMessageCreated = onDocumentCreated('messages/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { threadId, senderId, senderName, body } = data as {
    threadId: string; senderId: string; senderName: string; body: string;
  };

  const db = getFirestore();
  const threadDoc = await db.collection('messageThreads').doc(threadId).get();
  if (!threadDoc.exists) return;
  const thread = threadDoc.data() as { subject: string; participantIds: string[] };

  const recipientIds = thread.participantIds.filter((id) => id !== senderId);
  if (recipientIds.length === 0) return;

  const recipientDocs = await Promise.all(recipientIds.map((id) => db.collection('users').doc(id).get()));
  const recipients = recipientDocs
    .map((d) => (d.exists ? (d.data() as { email?: string }).email : undefined))
    .filter((e): e is string => Boolean(e));

  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `New message: ${thread.subject}`,
    html: emailLayout(thread.subject, `
      <p>${escapeHtml(body)}</p>
      <p style="color:#64748b; font-size: 13px;">— ${escapeHtml(senderName)}</p>
    `),
  });
});

// ---------------------------------------------------------------------------
// A one-off email a staff member sends directly to a student's guardian
// (see "Email parent" on the Student Profile) — distinct from Announcements,
// which always go to a whole audience. The guardian's address is resolved
// here from the student record rather than trusted from the client, so a
// stale or tampered `to` field on the request can't redirect the email.
// ---------------------------------------------------------------------------
export const onEmailRequestCreated = onDocumentCreated('emailRequests/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const { studentId, subject, body, senderName } = snap.data() as {
    studentId: string; subject: string; body: string; senderName: string;
  };

  const guardian = await guardianForStudent(studentId);
  const ref = snap.ref;

  if (!guardian?.email) {
    await ref.update({ status: 'failed' });
    return;
  }

  // sendMail logs and swallows its own failures (never throws) so a
  // notification issue can't fail the write that triggered it — so
  // "sent" here means "handed to Gmail", not a delivery confirmation.
  await sendMail({
    to: guardian.email,
    subject,
    html: emailLayout(subject, `
      <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
      <p style="color:#64748b; font-size: 13px;">— ${escapeHtml(senderName)}, regarding ${escapeHtml(guardian.studentName)}</p>
    `),
  });
  await ref.update({ status: 'sent' });
});

function escapeHtml(input: string): string {
  return String(input ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}
