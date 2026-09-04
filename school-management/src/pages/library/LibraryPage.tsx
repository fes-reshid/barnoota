import { useState } from 'react';
import { Plus, BookPlus, Undo2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { booksRepo, bookLoansRepo, studentsRepo } from '@/lib/services';
import type { Book } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const emptyBook = { title: '', author: '', category: '', isbn: '', totalCopies: 1 };

export default function LibraryPage() {
  usePageTitle('Library');
  const { schoolId } = useAuth();
  const { data: books, loading: l1, reload: reloadBooks } = useRepoList(booksRepo);
  const { data: loans, loading: l2, reload: reloadLoans } = useRepoList(bookLoansRepo);
  const { data: students } = useRepoList(studentsRepo);
  const { showToast } = useToast();

  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ bookId: '', studentId: '', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });

  async function handleAddBook() {
    if (!bookForm.title.trim()) return;
    await booksRepo.create({ schoolId, ...bookForm, availableCopies: bookForm.totalCopies });
    showToast('Book added.');
    setBookOpen(false);
    setBookForm(emptyBook);
    reloadBooks();
  }

  async function handleBorrow() {
    const book = books.find((b) => b.id === borrowForm.bookId);
    if (!book || book.availableCopies <= 0 || !borrowForm.studentId) return;
    await bookLoansRepo.create({
      schoolId, bookId: book.id, studentId: borrowForm.studentId, borrowedAt: new Date().toISOString().slice(0, 10),
      dueDate: borrowForm.dueDate, status: 'borrowed',
    });
    await booksRepo.update(book.id, { availableCopies: book.availableCopies - 1 });
    showToast('Book borrowed.');
    setBorrowOpen(false);
    reloadBooks();
    reloadLoans();
  }

  async function handleReturn(loanId: string, bookId: string) {
    await bookLoansRepo.update(loanId, { status: 'returned', returnedAt: new Date().toISOString().slice(0, 10) });
    const book = books.find((b) => b.id === bookId);
    if (book) await booksRepo.update(bookId, { availableCopies: Math.min(book.totalCopies, book.availableCopies + 1) });
    showToast('Book returned.');
    reloadBooks();
    reloadLoans();
  }

  const bookColumns: Column<Book>[] = [
    { header: 'Title', render: (b) => <div><p className="font-medium text-slate-800">{b.title}</p><p className="text-xs text-slate-500">{b.author}</p></div> },
    { header: 'Category', render: (b) => b.category },
    { header: 'ISBN', render: (b) => b.isbn },
    { header: 'Copies', render: (b) => <Badge tone={b.availableCopies > 0 ? 'green' : 'rose'}>{b.availableCopies} / {b.totalCopies} available</Badge> },
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button className="btn-secondary" onClick={() => setBorrowOpen(true)}><BookPlus className="h-4 w-4" /> Borrow book</button>
        <button className="btn-primary" onClick={() => setBookOpen(true)}><Plus className="h-4 w-4" /> Add book</button>
      </div>

      <Card>
        <CardHeader title="Catalogue" />
        <DataTable columns={bookColumns} rows={books} rowKey={(b) => b.id} loading={l1} emptyTitle="No books in the catalogue yet" />
      </Card>

      <Card>
        <CardHeader title="Active & overdue loans" />
        <DataTable
          loading={l2}
          rows={loans.filter((l) => l.status !== 'returned')}
          rowKey={(l) => l.id}
          emptyTitle="No active loans"
          columns={[
            { header: 'Book', render: (l) => books.find((b) => b.id === l.bookId)?.title ?? '—' },
            { header: 'Student', render: (l) => { const s = students.find((st) => st.id === l.studentId); return s ? `${s.firstName} ${s.lastName}` : '—'; } },
            { header: 'Due date', render: (l) => <Badge tone={l.dueDate < today ? 'rose' : 'sky'}>{l.dueDate}{l.dueDate < today ? ' (overdue)' : ''}</Badge> },
            { header: '', className: 'text-right', render: (l) => <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => handleReturn(l.id, l.bookId)}><Undo2 className="h-3.5 w-3.5" /> Return</button> },
          ]}
        />
      </Card>

      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Add book"
        footer={<>
          <button className="btn-secondary" onClick={() => setBookOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAddBook} disabled={!bookForm.title.trim()}>Save</button>
        </>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><FormField label="Title" required><input className="input" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></FormField></div>
          <FormField label="Author"><input className="input" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></FormField>
          <FormField label="Category"><input className="input" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} /></FormField>
          <FormField label="ISBN"><input className="input" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} /></FormField>
          <FormField label="Total copies"><input type="number" min={1} className="input" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} /></FormField>
        </div>
      </Modal>

      <Modal open={borrowOpen} onClose={() => setBorrowOpen(false)} title="Borrow book"
        footer={<>
          <button className="btn-secondary" onClick={() => setBorrowOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleBorrow} disabled={!borrowForm.bookId || !borrowForm.studentId}>Borrow</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Book">
            <select className="input" value={borrowForm.bookId} onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}>
              <option value="">Select a book</option>
              {books.filter((b) => b.availableCopies > 0).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>)}
            </select>
          </FormField>
          <FormField label="Student">
            <select className="input" value={borrowForm.studentId} onChange={(e) => setBorrowForm({ ...borrowForm, studentId: e.target.value })}>
              <option value="">Select a student</option>
              {students.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </FormField>
          <FormField label="Due date"><input type="date" className="input" value={borrowForm.dueDate} onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })} /></FormField>
        </div>
      </Modal>
    </div>
  );
}
