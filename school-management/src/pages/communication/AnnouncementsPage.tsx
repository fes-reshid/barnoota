import { useState } from 'react';
import { Plus, Pin, Trash2, Megaphone } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { announcementsRepo, classesRepo } from '@/lib/services';
import type { Announcement, AnnouncementAudience } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

const canCompose = (role: string) => role === 'school_admin' || role === 'teacher' || role === 'super_admin';

export default function AnnouncementsPage() {
  usePageTitle('Announcements');
  const { currentUser } = useAuth();
  const { data: announcements, loading, reload } = useRepoList(announcementsRepo);
  const { data: classes } = useRepoList(classesRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'everyone' as AnnouncementAudience, classId: '' });

  const { schoolId } = useAuth();

  const visible = announcements.filter((a) => {
    if (canCompose(currentUser?.role ?? '')) return true;
    if (a.audience === 'everyone') return true;
    if (a.audience === 'teachers') return currentUser?.role === 'teacher';
    if (a.audience === 'parents') return currentUser?.role === 'parent';
    if (a.audience === 'students') return currentUser?.role === 'student';
    return false;
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));

  async function handleCreate() {
    if (!form.title.trim() || !currentUser) return;
    await announcementsRepo.create({
      schoolId, title: form.title, body: form.body, audience: form.audience,
      classId: form.audience === 'class' ? form.classId : undefined,
      authorId: currentUser.id, authorName: currentUser.name, pinned: false,
    });
    showToast('Announcement posted.');
    setOpen(false);
    setForm({ title: '', body: '', audience: 'everyone', classId: '' });
    reload();
  }

  async function togglePin(a: Announcement) {
    await announcementsRepo.update(a.id, { pinned: !a.pinned });
    reload();
  }

  async function remove(a: Announcement) {
    await announcementsRepo.remove(a.id);
    showToast('Announcement removed.');
    reload();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {canCompose(currentUser?.role ?? '') && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Post announcement</button>
        </div>
      )}

      {visible.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title="No announcements yet" /></Card>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <Card key={a.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-brand-600" />}
                      <p className="font-semibold text-slate-800">{a.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                    <p className="mt-2 text-xs text-slate-400">By {a.authorName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone="violet">{a.audience}</Badge>
                    {canCompose(currentUser?.role ?? '') && (
                      <>
                        <button className="btn-ghost !px-2 !py-1" onClick={() => togglePin(a)}><Pin className="h-4 w-4" /></button>
                        <button className="btn-ghost !px-2 !py-1" onClick={() => remove(a)}><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post announcement"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={!form.title.trim()}>Post</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Title" required><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FormField>
          <FormField label="Message"><textarea className="input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></FormField>
          <FormField label="Audience">
            <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}>
              <option value="everyone">Everyone</option>
              <option value="teachers">Teachers</option>
              <option value="parents">Parents</option>
              <option value="students">Students</option>
              <option value="class">Specific class</option>
            </select>
          </FormField>
          {form.audience === 'class' && (
            <FormField label="Class">
              <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          )}
        </div>
      </Modal>
    </div>
  );
}
