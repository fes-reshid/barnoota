import type { School, Student } from '@/types';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface ReportCardRow {
  examName: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  teacherComment?: string;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 32px; color: #0f172a; background: #fff; }
  .head { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #1c5f41; padding-bottom: 16px; margin-bottom: 20px; }
  .head img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
  .head .school-name { font-size: 18px; font-weight: 700; color: #1c5f41; }
  .head .doc-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .student { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #334155; }
  .student b { color: #0f172a; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  tfoot td { font-weight: 700; border-top: 2px solid #1c5f41; border-bottom: none; }
  .foot { margin-top: 24px; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 16px; } }
`;

/**
 * Opens a popup window with a printable, school-branded report card (one
 * student's exam results + overall average) and triggers the print dialog.
 * Self-contained HTML, same approach as printStudentIdCards, so it prints
 * cleanly regardless of the dashboard page it was triggered from.
 */
export function printReportCard(student: Student, school: School, rows: ReportCardRow[]): void {
  const win = window.open('', '_blank', 'width=760,height=840');
  if (!win) return;

  const totalObtained = rows.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = rows.reduce((sum, r) => sum + r.maxMarks, 0);
  const average = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)} — Report Card</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="head">
    ${school.logoUrl ? `<img src="${escapeHtml(school.logoUrl)}" alt="">` : ''}
    <div>
      <div class="school-name">${escapeHtml(school.name)}</div>
      <div class="doc-title">Report Card</div>
    </div>
  </div>
  <div class="student">
    <span><b>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</b> · ${escapeHtml(student.yearLevel || '—')}</span>
    <span>Student ID: <b>${escapeHtml(student.studentCode)}</b></span>
  </div>
  <table>
    <thead>
      <tr><th>Exam</th><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Comment</th></tr>
    </thead>
    <tbody>
      ${rows.map((r) => {
        const pct = r.maxMarks ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
        return `<tr>
          <td>${escapeHtml(r.examName)}</td>
          <td>${escapeHtml(r.subjectName)}</td>
          <td>${r.marksObtained}/${r.maxMarks}</td>
          <td>${pct}%</td>
          <td>${escapeHtml(r.grade ?? '—')}</td>
          <td>${escapeHtml(r.teacherComment ?? '')}</td>
        </tr>`;
      }).join('\n')}
    </tbody>
    <tfoot>
      <tr><td colspan="3">Overall average</td><td>${average}%</td><td colspan="2"></td></tr>
    </tfoot>
  </table>
  <div class="foot">Generated ${escapeHtml(new Date().toLocaleDateString())} · ${escapeHtml(school.name)}</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  win.document.close();
}
