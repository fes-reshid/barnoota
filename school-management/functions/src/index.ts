import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { GMAIL_USER, GMAIL_APP_PASSWORD, sendMail, emailLayout } from './mailer.js';
import { guardianEmailsForClass, guardianEmailsForSchool, guardianForStudent, teacherEmailsForSchool } from './recipients.js';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10, secrets: [GMAIL_USER, GMAIL_APP_PASSWORD] });

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
  if (audience === 'everyone') {
    const [guardians, teachers] = await Promise.all([
      guardianEmailsForSchool(schoolId),
      teacherEmailsForSchool(schoolId),
    ]);
    recipients = [...guardians, ...teachers];
  } else if (audience === 'teachers') {
    recipients = await teacherEmailsForSchool(schoolId);
  } else if (audience === 'parents' || audience === 'students') {
    recipients = await guardianEmailsForSchool(schoolId);
  } else if (audience === 'class' && classId) {
    recipients = await guardianEmailsForClass(schoolId, classId);
  }

  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `New announcement: ${title}`,
    html: emailLayout(title, `
      <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
      <p style="color:#64748b; font-size: 13px;">— ${escapeHtml(authorName)}</p>
    `),
  });
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

  const recipients = await guardianEmailsForClass(schoolId, classId);
  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `New homework assigned: ${title}`,
    html: emailLayout('New homework assigned', `
      <p><strong>${escapeHtml(title)}</strong></p>
      <p>${escapeHtml(description)}</p>
      <p style="color:#64748b; font-size: 13px;">Due ${escapeHtml(dueDate)}</p>
    `),
  });
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
  const guardian = await guardianForStudent(studentId);
  if (!guardian) return;

  await sendMail({
    to: guardian.email,
    subject: `Attendance update for ${guardian.studentName}`,
    html: emailLayout('Attendance update', `
      <p><strong>${escapeHtml(guardian.studentName)}</strong> was marked <strong>${escapeHtml(after.status)}</strong> on ${escapeHtml(date)}.</p>
      ${after.note ? `<p style="color:#64748b; font-size: 13px;">Note: ${escapeHtml(after.note)}</p>` : ''}
    `),
  });
});

// ---------------------------------------------------------------------------
// Fees — new invoice assigned, and payment receipts.
// ---------------------------------------------------------------------------
export const onFeeInvoiceCreated = onDocumentCreated('feeInvoices/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { studentId, amount, dueDate } = data as { studentId: string; amount: number; dueDate: string };
  const guardian = await guardianForStudent(studentId);
  if (!guardian) return;

  await sendMail({
    to: guardian.email,
    subject: `New fee invoice for ${guardian.studentName}`,
    html: emailLayout('New fee invoice', `
      <p>A new invoice of <strong>$${amount.toLocaleString()}</strong> has been assigned for <strong>${escapeHtml(guardian.studentName)}</strong>, due ${escapeHtml(dueDate)}.</p>
    `),
  });
});

export const onPaymentCreated = onDocumentCreated('payments/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { studentId, amount, method, receiptNumber } = data as {
    studentId: string; amount: number; method: string; receiptNumber: string;
  };
  const guardian = await guardianForStudent(studentId);
  if (!guardian) return;

  await sendMail({
    to: guardian.email,
    subject: `Payment received — receipt ${receiptNumber}`,
    html: emailLayout('Payment received', `
      <p>We've received a payment of <strong>$${amount.toLocaleString()}</strong> for <strong>${escapeHtml(guardian.studentName)}</strong> via ${escapeHtml(method.replace('_', ' '))}.</p>
      <p style="color:#64748b; font-size: 13px;">Receipt: ${escapeHtml(receiptNumber)}</p>
    `),
  });
});

function escapeHtml(input: string): string {
  return String(input ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}
