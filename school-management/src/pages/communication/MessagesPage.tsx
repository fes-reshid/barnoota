import { useMemo, useState } from 'react';
import { Plus, Send, MessageSquare } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { messageThreadsRepo, messagesRepo, teachersRepo, studentsRepo, classesRepo, usersRepo, timetableRepo } from '@/lib/services';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

interface RecipientOption {
  key: string;
  kind: 'Teacher' | 'Parent' | 'Student';
  userId: string;
  /** Stored as the thread's participant name — kept clean (no "re: ..." suffix). */
  label: string;
  /** Extra context shown only in the picker, e.g. "re: Amina Hassan". */
  hint?: string;
}

export default function MessagesPage() {
  usePageTitle('Messages');
  const { currentUser, schoolId } = useAuth();

  const { data: threads, loading: l1, reload: reloadThreads } = useRepoList(messageThreadsRepo);
  const { data: allMessages, loading: l2, reload: reloadMessages } = useRepoList(messagesRepo);
  const { data: teachers, loading: l3 } = useRepoList(teachersRepo);
  const { data: students, loading: l4 } = useRepoList(studentsRepo);
  const { data: classes, loading: l5 } = useRepoList(classesRepo);
  const { data: users, loading: l6 } = useRepoList(usersRepo);
  const { data: timetable, loading: l7 } = useRepoList(timetableRepo);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [recipientKey, setRecipientKey] = useState('');
  const [draft, setDraft] = useState('');

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

  // Who the signed-in user is allowed to start a conversation with — built
  // fresh per role rather than one generic rule, since each role reaches
  // people through a different relationship (admin sees everyone, a
  // teacher only their own students/guardians, a student only the
  // teachers actually teaching their class).
  const recipientOptions = useMemo((): RecipientOption[] => {
    if (!currentUser) return [];
    const options: RecipientOption[] = [];

    if (currentUser.role === 'school_admin') {
      for (const u of users.filter((u) => u.role === 'teacher')) {
        options.push({ key: `t-${u.id}`, kind: 'Teacher', userId: u.id, label: u.name });
      }
      for (const u of users.filter((u) => u.role === 'parent')) {
        options.push({ key: `p-${u.id}`, kind: 'Parent', userId: u.id, label: u.name });
      }
      for (const u of users.filter((u) => u.role === 'student')) {
        const s = students.find((s) => s.id === u.studentId);
        options.push({ key: `s-${u.id}`, kind: 'Student', userId: u.id, label: u.name, hint: s?.yearLevel });
      }
      return options;
    }

    if (currentUser.role === 'teacher') {
      const myClassIds = classes.filter((c) => c.classTeacherId === currentUser.teacherId).map((c) => c.id);
      const teachableStudents = students.filter((s) => s.status === 'active' && (myClassIds.length === 0 || myClassIds.includes(s.classId)));

      const seenParents = new Set<string>();
      for (const s of teachableStudents) {
        const parentUser = users.find((u) => u.role === 'parent' && (u.id === s.parentUserId || u.childrenIds?.includes(s.id)));
        if (parentUser && !seenParents.has(parentUser.id)) {
          seenParents.add(parentUser.id);
          options.push({ key: `p-${parentUser.id}`, kind: 'Parent', userId: parentUser.id, label: parentUser.name, hint: `re: ${s.firstName} ${s.lastName}` });
        }
      }
      for (const s of teachableStudents) {
        const studentUser = users.find((u) => u.role === 'student' && u.studentId === s.id);
        if (studentUser) {
          options.push({ key: `s-${studentUser.id}`, kind: 'Student', userId: studentUser.id, label: studentUser.name });
        }
      }
      return options;
    }

    if (currentUser.role === 'parent') {
      for (const t of teachers) {
        const teacherUser = users.find((u) => u.role === 'teacher' && u.teacherId === t.id);
        if (teacherUser) options.push({ key: `t-${teacherUser.id}`, kind: 'Teacher', userId: teacherUser.id, label: teacherUser.name });
      }
      return options;
    }

    if (currentUser.role === 'student') {
      const myStudent = students.find((s) => s.id === currentUser.studentId);
      if (!myStudent) return options;
      const myClass = classes.find((c) => c.id === myStudent.classId);
      const teacherIds = new Set<string>();
      if (myClass?.classTeacherId) teacherIds.add(myClass.classTeacherId);
      timetable.filter((t) => t.classId === myStudent.classId).forEach((t) => teacherIds.add(t.teacherId));

      for (const tid of teacherIds) {
        const teacherUser = users.find((u) => u.role === 'teacher' && u.teacherId === tid);
        if (teacherUser) options.push({ key: `t-${teacherUser.id}`, kind: 'Teacher', userId: teacherUser.id, label: teacherUser.name });
      }
      return options;
    }

    return options;
  }, [currentUser, users, students, teachers, classes, timetable]);

  if (loading) return <Spinner />;

  const myThreads = threads.filter((t) => t.participantIds.includes(currentUser?.id ?? ''));
  const activeThread = myThreads.find((t) => t.id === activeThreadId) ?? myThreads[0] ?? null;
  const threadMessages = activeThread ? allMessages.filter((m) => m.threadId === activeThread.id).sort((a, b) => a.sentAt.localeCompare(b.sentAt)) : [];
  const selectedOption = recipientOptions.find((o) => o.key === recipientKey) ?? null;

  function resetNewConversationForm() {
    setSubject('');
    setRecipientKey(recipientOptions[0]?.key ?? '');
  }

  async function createThread() {
    if (!subject.trim() || !currentUser || !selectedOption) return;
    const thread = await messageThreadsRepo.create({
      schoolId, subject,
      participantIds: [currentUser.id, selectedOption.userId],
      participantNames: [currentUser.name, selectedOption.label],
      lastMessagePreview: '', lastMessageAt: new Date().toISOString(),
    });
    setActiveThreadId(thread.id);
    setNewOpen(false);
    reloadThreads();
  }

  async function sendMessage() {
    if (!draft.trim() || !activeThread || !currentUser) return;
    await messagesRepo.create({
      schoolId, threadId: activeThread.id, senderId: currentUser.id, senderName: currentUser.name,
      body: draft, sentAt: new Date().toISOString(), readBy: [currentUser.id],
    });
    await messageThreadsRepo.update(activeThread.id, { lastMessagePreview: draft, lastMessageAt: new Date().toISOString() });
    setDraft('');
    reloadMessages();
    reloadThreads();
  }

  const groupedOptions: Record<RecipientOption['kind'], RecipientOption[]> = { Teacher: [], Parent: [], Student: [] };
  for (const o of recipientOptions) groupedOptions[o.kind].push(o);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Conversations</h3>
          <button className="btn-ghost !px-2 !py-1" onClick={() => { resetNewConversationForm(); setNewOpen(true); }}><Plus className="h-4 w-4" /></button>
        </div>
        {myThreads.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No conversations yet" action={<button className="btn-primary" onClick={() => { resetNewConversationForm(); setNewOpen(true); }}>Start a conversation</button>} />
        ) : (
          <div className="divide-y divide-slate-100">
            {myThreads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`block w-full px-5 py-3 text-left hover:bg-slate-50 ${activeThread?.id === t.id ? 'bg-brand-50' : ''}`}
              >
                <p className="text-sm font-medium text-slate-700">{t.subject}</p>
                <p className="truncate text-xs text-slate-500">{t.lastMessagePreview || 'No messages yet'}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        {!activeThread ? (
          <EmptyState title="Select a conversation" />
        ) : (
          <>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">{activeThread.subject}</p>
              <p className="text-xs text-slate-500">{activeThread.participantNames.join(', ')}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ minHeight: 240 }}>
              {threadMessages.length === 0 ? (
                <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
              ) : (
                threadMessages.map((m) => (
                  <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.senderId === currentUser?.id ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <p>{m.body}</p>
                    <p className={`mt-1 text-[10px] ${m.senderId === currentUser?.id ? 'text-brand-100' : 'text-slate-400'}`}>{m.senderName}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 p-4">
              <input className="input" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
              <button className="btn-primary" onClick={sendMessage}><Send className="h-4 w-4" /></button>
            </div>
          </>
        )}
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New conversation"
        footer={<>
          <button className="btn-secondary" onClick={() => setNewOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={createThread} disabled={!subject.trim() || !selectedOption}>Start</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Subject"><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></FormField>
          {recipientOptions.length === 0 ? (
            <p className="text-sm text-slate-500">No one available to message yet.</p>
          ) : (
            <FormField label="To">
              <select className="input" value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)}>
                {(['Teacher', 'Parent', 'Student'] as const).map((kind) => groupedOptions[kind].length > 0 && (
                  <optgroup key={kind} label={`${kind}s`}>
                    {groupedOptions[kind].map((o) => (
                      <option key={o.key} value={o.key}>{o.label}{o.hint ? ` — ${o.hint}` : ''}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </FormField>
          )}
        </div>
      </Modal>
    </div>
  );
}
