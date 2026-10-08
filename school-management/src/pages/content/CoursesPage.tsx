import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingBag, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { coursesRepo, coursePurchasesRepo } from '@/lib/services';
import { courseCoverPath } from '@/lib/fileStorage';
import type { Course } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { FileUpload } from '@/components/ui/FileUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { title: '', description: '', price: 0, coverImageUrl: '' };

export default function CoursesPage() {
  usePageTitle('Content Marketplace');
  const { currentUser, schoolId } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'school_admin';

  const { data: courses, loading: l1, reload } = useRepoList(coursesRepo);
  const { data: purchases, loading: l2 } = useRepoList(coursePurchasesRepo);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Course | null>(null);

  useEffect(() => {
    setForm(editing ? { title: editing.title, description: editing.description, price: editing.price, coverImageUrl: editing.coverImageUrl ?? '' } : emptyForm);
  }, [editing, open]);

  if (l1 || l2) return <Spinner />;

  const visibleCourses = isAdmin ? courses : courses.filter((c) => c.published);
  const myPurchase = (courseId: string) => purchases.find((p) => p.courseId === courseId && p.buyerUserId === currentUser?.id);

  async function handleSave() {
    if (!form.title.trim() || !currentUser) return;
    if (editing) {
      await coursesRepo.update(editing.id, form);
      showToast('Course updated.');
    } else {
      await coursesRepo.create({ schoolId, ...form, published: false, createdBy: currentUser.id });
      showToast('Course created as a draft — publish it when ready.');
    }
    setOpen(false);
    reload();
  }

  async function togglePublished(course: Course) {
    await coursesRepo.update(course.id, { published: !course.published });
    reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    await coursesRepo.remove(deleting.id);
    showToast('Course removed.');
    setDeleting(null);
    reload();
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New course</button>
        </div>
      )}

      {visibleCourses.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={isAdmin ? 'No courses yet' : 'No courses available yet'}
          description={isAdmin ? 'Create a course and publish it to start selling it to your parents and students.' : "Check back later — there's nothing for sale here yet."}
          action={isAdmin && <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New course</button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((c) => {
            const purchase = myPurchase(c.id);
            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-brand-50">
                  {c.coverImageUrl ? (
                    <img src={c.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-brand-300" />
                  )}
                </div>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={c.id} className="font-semibold text-slate-800 hover:underline">{c.title}</Link>
                    {isAdmin && <Badge tone={c.published ? 'green' : 'slate'}>{c.published ? 'Published' : 'Draft'}</Badge>}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-500">{c.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-bold text-slate-800">{c.price === 0 ? 'Free' : `$${c.price.toLocaleString()}`}</p>
                    {!isAdmin && purchase?.status === 'paid' && <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Owned</Badge>}
                    {!isAdmin && purchase?.status === 'pending' && <Badge tone="amber"><Clock className="h-3 w-3" /> Pending payment</Badge>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-1">
                      <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => togglePublished(c)}>{c.published ? 'Unpublish' : 'Publish'}</button>
                      <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => setDeleting(c)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit course' : 'New course'}
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim()}>Save</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Title" required><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FormField>
          <FormField label="Description"><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Price (0 = free)"><input type="number" min={0} className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></FormField>
          <FormField label="Cover image">
            <div className="flex items-center gap-3">
              {form.coverImageUrl && <img src={form.coverImageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <FileUpload
                label={form.coverImageUrl ? 'Replace image' : 'Upload image'}
                accept="image/*"
                buildPath={(fileName) => courseCoverPath(schoolId, editing?.id ?? 'new', fileName)}
                onUploaded={(file) => setForm({ ...form, coverImageUrl: file.url })}
              />
            </div>
          </FormField>
          {!editing && <p className="text-xs text-slate-500">New courses start as a draft — publish them from the list once you've added lessons.</p>}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete course?" message={`${deleting?.title} and all of its lessons will be permanently removed. Existing purchases are kept for your records.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
