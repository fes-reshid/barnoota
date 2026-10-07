import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { feeInvoicesRepo, feeStructuresRepo, studentsRepo, feePaymentsRepo, schoolsRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet, Printer } from 'lucide-react';
import { printFeeReceipt } from '@/lib/printFeeReceipt';
import type { FeePayment, Student } from '@/types';

export default function FeesViewPage() {
  usePageTitle('Fees');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: invoices, loading: l2 } = useRepoList(feeInvoicesRepo);
  const { data: structures, loading: l3 } = useRepoList(feeStructuresRepo);
  const { data: payments, loading: l4 } = useRepoList(feePaymentsRepo);
  const { data: schools, loading: l5 } = useRepoList(schoolsRepo);

  if (l1 || l2 || l3 || l4 || l5) return <Spinner />;
  const school = schools[0];

  function handlePrintReceipt(payment: FeePayment, student: Student) {
    if (!school) return;
    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    const feeName = structures.find((f) => f.id === invoice?.feeStructureId)?.name ?? 'Fee payment';
    printFeeReceipt(payment, student, feeName, school);
  }

  const targets = currentUser?.role === 'student'
    ? students.filter((s) => s.id === currentUser.studentId)
    : students.filter((s) => (currentUser?.childrenIds ?? []).includes(s.id));

  if (targets.length === 0) return <EmptyState icon={Wallet} title="No linked student profile" />;

  return (
    <div className="space-y-6">
      {targets.map((student) => {
        const studentInvoices = invoices.filter((i) => i.studentId === student.id);
        const studentPayments = payments.filter((p) => p.studentId === student.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
        return (
          <div key={student.id} className="space-y-4">
            <Card>
              <CardHeader title={`${student.firstName} ${student.lastName}`} subtitle="Fee invoices" />
              {studentInvoices.length === 0 ? <EmptyState title="No invoices yet" /> : (
                <CardBody className="!p-0 divide-y divide-slate-100">
                  {studentInvoices.map((inv) => {
                    const structure = structures.find((f) => f.id === inv.feeStructureId);
                    const balance = inv.amount - inv.discount - inv.amountPaid;
                    return (
                      <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{structure?.name}</p>
                          <p className="text-xs text-slate-500">Due {inv.dueDate} · ${inv.amountPaid.toLocaleString()} of ${inv.amount.toLocaleString()} paid</p>
                        </div>
                        <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'rose'}>
                          {inv.status === 'paid' ? 'Paid' : `$${balance.toLocaleString()} due`}
                        </Badge>
                      </div>
                    );
                  })}
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader title="Payment history" />
              {studentPayments.length === 0 ? <EmptyState title="No payments recorded yet" /> : (
                <CardBody className="!p-0 divide-y divide-slate-100">
                  {studentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm text-slate-700">{p.receiptNumber}</p>
                        <p className="text-xs text-slate-500">{new Date(p.paidAt).toLocaleDateString()} · {p.method.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-slate-800">${p.amount.toLocaleString()}</p>
                        <button
                          className="btn-secondary !py-1 !px-2.5 text-xs"
                          onClick={() => handlePrintReceipt(p, student)}
                        >
                          <Printer className="h-3.5 w-3.5" /> Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
