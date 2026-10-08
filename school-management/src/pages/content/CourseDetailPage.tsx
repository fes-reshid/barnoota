import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Lock, FileText, Pencil, Trash2, ShoppingBag, CheckCircle2, Clock } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { coursesRepo, courseLessonsRepo, coursePurchasesRepo } from '@/lib/services';
import { courseLessonAttachmentPath } from '@/lib/fileStorage';
import type { CourseLesson } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileLink } from '@/components/ui/FileLink';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyLessonForm = { title: '', body: '', attachmentUrl: '' };

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, schoolId } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'school_admin';

  const { data: courses, loading: l1 } = useRepoList(coursesRepo);
  const { data: lessons, loading: l2, reload: reloadLessons } = useRepoList(courseLessonsRepo);
  const { data: purchases, loading: l3, reload: reloadPurchases } = useRepoList(coursePurchasesRepo);

  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [deletingLesson, setDeletingLesson] = useState<CourseLesson | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const course = courses.find((c) => c.id === id);
  usePageTitle(course?.title ?? 'Course');

  useEffect(() => {
    setLessonForm(editingLesson ? { title: editingLesson.title, body: editingLesson.body, attachmentUrl: editingLesson.attachmentUrl ?? '' } : emptyLessonForm);
  }, [editingLesson, lessonOpen]);

  if (l1 || l2 || l3) return <Spinner />;
  if (!course) return <EmptyState title="Course not found" />;

  const myLessons = lessons.filter((l) => l.courseId === course.id).sort((a, b) => a.order - b.order);
  const myPurchase = purchases.find((p) => p.courseId === course.id && p.buyerUserId === currentUser?.id);
  const hasAccess = isAdmin || course.price === 0 || myPurchase?.status === 'paid';
  const coursePurchases = purchases.filter((p) => p.courseId === course.id);

  async function handleSaveLesson() {
    if (!lessonForm.title.trim() || !course) return;
    if (editingLesson) {
      await courseLessonsRepo.update(editingLesson.id, lessonForm);
      showToast('Lesson updated.');
    } else {
      await courseLessonsRepo.create({ schoolId, courseId: course.id, order: myLessons.length, ...lessonForm });
      showToast('Lesson added.');
    }
    setLessonOpen(false);
    reloadLessons();
  }

  async function handleDeleteLesson() {
    if (!deletingLesson) return;
    await courseLessonsRepo.remove(deletingLesson.id);
    showToast('Lesson removed.');
    setDeletingLesson(null);
    reloadLessons();
  }

  async function handleEnroll() {
    if (!currentUser || !course) return;
    setEnrolling(true);
    try {
      await coursePurchasesRepo.create({
        schoolId, courseId: course.id, buyerUserId: currentUser.id, buyerName: currentUser.name,
        amount: course.price, status: 'pending',
      });
      showToast('Enrollment requested — the school will confirm once payment is received.');
      reloadPurchases();
    } finally {
      setEnrolling(false);
    }
  }

  async function markPaid(purchaseId: string) {
    await coursePurchasesRepo.update(purchaseId, { status: 'paid', paidAt: new Date().toISOString(), method: 'cash' });
    showToast('Marked as paid — the buyer now has access.');
    reloadPurchases();
  }

  return (
    <div className="space-y-4">
      <Link to=".." relative="path" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /> Back to courses</Link>

      <Card>
        <CardHeader
          title={course.title}
          subtitle={course.price === 0 ? 'Free' : `$${course.price.toLocaleString()}`}
        />
        <CardBody>
          <p className="text-sm text-slate-600">{course.description}</p>
          {!isAdmin && !hasAccess && (
            <div className="mt-4">
              {myPurchase?.status === 'pending' ? (
                <Badge tone="amber"><Clock className="h-3 w-3" /> Payment pending — contact the school office to complete it</Badge>
              ) : (
                <button className="btn-primary" onClick={handleEnroll} disabled={enrolling}>
                  <ShoppingBag className="h-4 w-4" /> Enroll {course.price > 0 ? `— $${course.price.toLocaleString()}` : ''}
                </button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Lessons"
          action={isAdmin && <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => { setEditingLesson(null); setLessonOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add lesson</button>}
        />
        {myLessons.length === 0 ? (
          <EmptyState icon={FileText} title="No lessons yet" />
        ) : !hasAccess ? (
          <CardBody className="!p-0 divide-y divide-slate-100">
            {myLessons.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3 text-slate-400">
                <Lock className="h-4 w-4" />
                <p className="text-sm">{l.title}</p>
              </div>
            ))}
          </CardBody>
        ) : (
          <CardBody className="!p-0 divide-y divide-slate-100">
            {myLessons.map((l) => (
              <div key={l.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{l.title}</p>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button className="btn-ghost !p-1" onClick={() => { setEditingLesson(l); setLessonOpen(true); }}><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="btn-ghost !p-1" onClick={() => setDeletingLesson(l)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{l.body}</p>
                {l.attachmentUrl && <FileLink url={l.attachmentUrl} name="Attachment" />}
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader title="Sales" subtitle={`${coursePurchases.filter((p) => p.status === 'paid').length} paid · ${coursePurchases.filter((p) => p.status === 'pending').length} pending`} />
          {coursePurchases.length === 0 ? (
            <EmptyState title="No enrollments yet" />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {coursePurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.buyerName}</p>
                    <p className="text-xs text-slate-500">${p.amount.toLocaleString()}</p>
                  </div>
                  {p.status === 'paid' ? (
                    <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>
                  ) : (
                    <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => markPaid(p.id)}>Mark as paid</button>
                  )}
                </div>
              ))}
            </CardBody>
          )}
        </Card>
      )}

      <Modal open={lessonOpen} onClose={() => setLessonOpen(false)} title={editingLesson ? 'Edit lesson' : 'Add lesson'}
        footer={<>
          <button className="btn-secondary" onClick={() => setLessonOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveLesson} disabled={!lessonForm.title.trim()}>Save</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Title" required><input className="input" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></FormField>
          <FormField label="Content"><textarea className="input" rows={5} value={lessonForm.body} onChange={(e) => setLessonForm({ ...lessonForm, body: e.target.value })} /></FormField>
          <FormField label="Attachment (optional)">
            <div className="flex items-center gap-3">
              {lessonForm.attachmentUrl && <FileLink url={lessonForm.attachmentUrl} name="Current attachment" />}
              <FileUpload
                label={lessonForm.attachmentUrl ? 'Replace file' : 'Upload file'}
                buildPath={(fileName) => courseLessonAttachmentPath(schoolId, course.id, editingLesson?.id ?? 'new', fileName)}
                onUploaded={(file) => setLessonForm({ ...lessonForm, attachmentUrl: file.url })}
              />
            </div>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deletingLesson} title="Delete lesson?" message={`${deletingLesson?.title} will be permanently removed.`} onConfirm={handleDeleteLesson} onCancel={() => setDeletingLesson(null)} />
    </div>
  );
}
