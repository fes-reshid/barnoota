import { schoolLoginDomain } from './schoolLoginDomain';
import type { School, SchoolClass, Student } from '@/types';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function cardHtml(student: Student, school: School, className: string): string {
  const loginId = `${student.studentCode}@${schoolLoginDomain(school.name)}`;
  return `
  <div class="card">
    <div class="head">
      ${school.logoUrl ? `<img src="${escapeHtml(school.logoUrl)}" alt="">` : ''}
      <div class="school-name">${escapeHtml(school.name)}</div>
    </div>
    <div class="body">
      ${student.photoUrl
        ? `<img class="photo" src="${escapeHtml(student.photoUrl)}" alt="">`
        : `<div class="photo-fallback">${escapeHtml(student.firstName[0] ?? '')}${escapeHtml(student.lastName[0] ?? '')}</div>`}
      <div class="info">
        <div class="name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div>
        <div class="meta">${escapeHtml(className)} · ${escapeHtml(student.yearLevel || '—')}</div>
        <div class="meta">DOB ${escapeHtml(student.dob)}</div>
        <div class="code">${escapeHtml(student.studentCode)}</div>
      </div>
    </div>
    <div class="foot"><b>Login:</b> ${escapeHtml(loginId)}</div>
  </div>`;
}

const CARD_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 24px; background: #f1f5f9; }
  .grid { display: flex; flex-wrap: wrap; gap: 16px; }
  .card {
    width: 3.375in; height: 2.125in; border-radius: 14px; overflow: hidden;
    background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;
    display: flex; flex-direction: column; break-inside: avoid; page-break-inside: avoid;
  }
  .head { background: #1c5f41; color: #fff; padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
  .head img { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; background: #fff; }
  .head .school-name { font-size: 11px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.2; }
  .body { flex: 1; display: flex; gap: 10px; padding: 10px 12px; align-items: center; }
  .photo { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; background: #e2e8f0; flex-shrink: 0; }
  .photo-fallback {
    width: 56px; height: 56px; border-radius: 8px; background: #dcf2e3; color: #1c5f41; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;
  }
  .info { min-width: 0; }
  .name { font-size: 13px; font-weight: 700; color: #0f172a; }
  .meta { font-size: 10px; color: #475569; margin-top: 2px; }
  .code { font-size: 10px; font-weight: 700; color: #1c5f41; margin-top: 4px; letter-spacing: 0.03em; }
  .foot { border-top: 1px dashed #cbd5e1; padding: 6px 12px; font-size: 9px; color: #64748b; }
  .foot b { color: #1c5f41; }
  @media print {
    body { background: #fff; padding: 0; }
    .card { box-shadow: none; }
  }
`;

/**
 * Opens a popup window with one or more printable student ID cards (same
 * card markup as the single-student view) and triggers the print dialog.
 * Self-contained HTML rather than reusing the app's own layout/CSS, so it
 * prints cleanly regardless of what page it was triggered from.
 */
export function printStudentIdCards(
  students: Student[],
  school: School,
  classes: SchoolClass[],
): void {
  if (students.length === 0) return;
  const win = window.open('', '_blank', 'width=760,height=700');
  if (!win) return;

  const classNameFor = (classId: string) => classes.find((c) => c.id === classId)?.name ?? '—';
  const title = students.length === 1
    ? `${students[0].firstName} ${students[0].lastName} — Student ID`
    : `Student ID cards (${students.length})`;

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${CARD_STYLES}</style>
</head>
<body>
  <div class="grid">
    ${students.map((s) => cardHtml(s, school, classNameFor(s.classId))).join('\n')}
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  win.document.close();
}
