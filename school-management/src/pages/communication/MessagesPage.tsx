import { useState } from 'react';
import { Plus, Send, MessageSquare } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { messageThreadsRepo, messagesRepo, teachersRepo } from '@/lib/services';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export default function MessagesPage() {
  usePageTitle('Messages');
  const { currentUser, schoolId } = useAuth();
  const { data: threads, loading: l1, reload: reloadThreads } = useRepoList(messageThreadsRepo);
  const { data: allMessages, loading: l2, reload: reloadMessages } = useRepoList(messagesRepo);
  const { data: teachers } = useRepoList(teachersRepo);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '');
  const [draft, setDraft] = useState('');

  if (l1 || l2) return <Spinner />;

  const myThreads = threads.filter((t) => t.participantIds.includes(currentUser?.id ?? ''));
  const activeThread = myThreads.find((t) => t.id === activeThreadId) ?? myThreads[0] ?? null;
  const threadMessages = activeThread ? allMessages.filter((m) => m.threadId === activeThread.id).sort((a, b) => a.sentAt.localeCompare(b.sentAt)) : [];

  async function createThread() {
    if (!subject.trim() || !teacherId || !currentUser) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    const thread = await messageThreadsRepo.create({
      schoolId, subject, participantIds: [currentUser.id, teacherId],
      participantNames: [currentUser.name, teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher'],
      lastMessagePreview: '', lastMessageAt: new Date().toISOString(),
    });
    setActiveThreadId(thread.id);
    setNewOpen(false);
    setSubject('');
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Conversations</h3>
          <button className="btn-ghost !px-2 !py-1" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /></button>
        </div>
        {myThreads.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No conversations yet" action={<button className="btn-primary" onClick={() => setNewOpen(true)}>Start a conversation</button>} />
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
          <button className="btn-primary" onClick={createThread} disabled={!subject.trim()}>Start</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Subject"><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></FormField>
          <FormField label="Teacher">
            <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
