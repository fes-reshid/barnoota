'use strict';

/**
 * Formats and sends the activity report a parent requests on demand. Scope
 * is deliberately narrow: a list of domains the filter blocked, with
 * timestamps — not a full browsing history, and only ever sent when the
 * parent explicitly clicks "Send report now" (see README: no schedule, no
 * background sending).
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportText(entries, { totalCount } = {}) {
  if (entries.length === 0) {
    return 'Noor Shield: no blocked attempts recorded since the log was last cleared.';
  }
  const lines = entries.map((e) => `${new Date(e.timestampMs).toLocaleString()}  —  ${e.domain}`);
  const header =
    totalCount && totalCount > entries.length
      ? `Noor Shield blocked ${totalCount} attempt(s); showing the most recent ${entries.length}:`
      : `Noor Shield blocked ${entries.length} attempt(s):`;
  return `${header}\n\n${lines.join('\n')}`;
}

function buildReportHtml(entries, { totalCount } = {}) {
  if (entries.length === 0) {
    return '<p>No blocked attempts recorded since the log was last cleared.</p>';
  }
  const header =
    totalCount && totalCount > entries.length
      ? `Blocked ${totalCount} attempt(s); showing the most recent ${entries.length}:`
      : `Blocked ${entries.length} attempt(s):`;
  const rows = entries
    .map(
      (e) =>
        `<tr><td style="padding:4px 12px 4px 0;white-space:nowrap;color:#4B5A52;">${escapeHtml(
          new Date(e.timestampMs).toLocaleString()
        )}</td><td style="padding:4px 0;font-family:Consolas,monospace;">${escapeHtml(e.domain)}</td></tr>`
    )
    .join('');
  return (
    `<p style="font-family:sans-serif;color:#16241D;">${escapeHtml(header)}</p>` +
    `<table style="border-collapse:collapse;font-size:0.9em;">${rows}</table>`
  );
}

/**
 * @param {object} opts
 * @param {object} opts.smtp - { host, port, secure, user, password, from }
 * @param {string} opts.recipient
 * @param {Array}  opts.entries
 * @param {number} [opts.totalCount]
 */
async function sendReport({ smtp, recipient, entries, totalCount }) {
  if (!smtp || !smtp.host) {
    throw new Error('Email is not configured yet — add SMTP settings first.');
  }
  if (!recipient) {
    throw new Error('Enter a recipient email address first.');
  }

  // Required lazily so environments that never touch email (e.g. the test
  // scripts) don't pay for loading it.
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 587,
    secure: Boolean(smtp.secure),
    auth: smtp.user ? { user: smtp.user, pass: smtp.password || '' } : undefined,
  });

  const count = entries.length;
  await transporter.sendMail({
    from: smtp.from || smtp.user,
    to: recipient,
    subject: `Noor Shield activity report — ${count} blocked attempt${count === 1 ? '' : 's'}`,
    text: buildReportText(entries, { totalCount }),
    html: buildReportHtml(entries, { totalCount }),
  });
}

module.exports = { sendReport, buildReportText, buildReportHtml };
