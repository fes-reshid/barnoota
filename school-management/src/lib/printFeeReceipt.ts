import type { FeePayment, School, Student } from '@/types';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 32px; color: #0f172a; background: #fff; display: flex; justify-content: center; }
  .receipt { width: 420px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .head { display: flex; align-items: center; gap: 10px; background: #1c5f41; color: #fff; padding: 16px 20px; }
  .head img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; background: #fff; }
  .head .school-name { font-size: 14px; font-weight: 700; }
  .head .doc-title { font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.06em; }
  .body { padding: 20px; font-size: 13px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; }
  .row b { color: #0f172a; }
  .amount { text-align: center; margin: 16px 0; }
  .amount .value { font-size: 28px; font-weight: 700; color: #1c5f41; }
  .amount .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
  .foot { padding: 0 20px 20px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
`;

/**
 * Opens a popup window with a printable, school-branded payment receipt and
 * triggers the print dialog. Same self-contained-HTML approach as
 * printStudentIdCards/printReportCard.
 */
export function printFeeReceipt(payment: FeePayment, student: Student, feeName: string, school: School): void {
  const win = window.open('', '_blank', 'width=520,height=680');
  if (!win) return;

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt ${escapeHtml(payment.receiptNumber)}</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="receipt">
    <div class="head">
      ${school.logoUrl ? `<img src="${escapeHtml(school.logoUrl)}" alt="">` : ''}
      <div>
        <div class="school-name">${escapeHtml(school.name)}</div>
        <div class="doc-title">Payment Receipt</div>
      </div>
    </div>
    <div class="body">
      <div class="amount">
        <div class="value">$${payment.amount.toLocaleString()}</div>
        <div class="label">Amount paid</div>
      </div>
      <div class="row"><span>Receipt No.</span><b>${escapeHtml(payment.receiptNumber)}</b></div>
      <div class="row"><span>Student</span><b>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</b></div>
      <div class="row"><span>Student ID</span><b>${escapeHtml(student.studentCode)}</b></div>
      <div class="row"><span>Fee</span><b>${escapeHtml(feeName)}</b></div>
      <div class="row"><span>Payment method</span><b>${escapeHtml(payment.method.replace('_', ' '))}</b></div>
      <div class="row"><span>Date</span><b>${escapeHtml(new Date(payment.paidAt).toLocaleDateString())}</b></div>
    </div>
    <div class="foot">${escapeHtml(school.name)} · ${escapeHtml(school.address)}</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  win.document.close();
}
