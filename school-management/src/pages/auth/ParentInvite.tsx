import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { GraduationCap, Loader2 } from 'lucide-react';
import { auth, isFirebaseConfigured } from '@/firebase/config';
import { parentInvitesRepo, schoolsRepo } from '@/lib/services';
import { setById } from '@/lib/repository';
import { useAuth } from '@/context/AuthContext';
import { homePathForRole } from '@/lib/roles';
import { friendlyErrorMessage } from '@/lib/friendlyError';
import type { AppUser, ParentInvite, School } from '@/types';

export default function ParentInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { currentUser } = useAuth();

  const [invite, setInvite] = useState<ParentInvite | null | undefined>(undefined);
  const [school, setSchool] = useState<School | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    parentInvitesRepo.get(token).then(async (inv) => {
      setInvite(inv);
      if (inv) {
        const s = await schoolsRepo.get(inv.schoolId);
        setSchool(s);
      }
    });
  }, [token]);

  if (currentUser) {
    return <Navigate to={homePathForRole(currentUser.role)} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !invite) return;
    setError('');
    if (!name.trim()) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!isFirebaseConfigured || !auth) return setError('This invite link requires a connected school — contact your school admin.');

    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      const now = new Date().toISOString();

      const profile: Omit<AppUser, 'id'> = {
        schoolId: invite.schoolId,
        authUid: uid,
        name: name.trim(),
        email: email.trim(),
        role: 'parent',
        childrenIds: [invite.studentId],
        inviteToken: token,
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      await setById<AppUser>('users', uid, profile);
      await parentInvitesRepo.update(token, { status: 'used', usedByUid: uid, usedAt: now });
      // Signing up already signs the user in — AuthContext's own
      // onAuthStateChanged listener picks this up and loads the profile
      // we just wrote, which then redirects them via the check above.
    } catch (err) {
      setError(friendlyErrorMessage(err, 'Could not create your account.'));
      setSubmitting(false);
    }
  }

  if (invite === undefined) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (!invite || invite.status !== 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-800">This invite link isn't valid</h1>
          <p className="mt-2 text-sm text-slate-500">
            It may have already been used, or the link was copied incorrectly. Ask your school admin to send a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{school?.name ?? 'Parent portal'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set up your login to follow <b>{invite.studentName}</b>'s attendance, homework, and progress.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Your name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full justify-center" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create my account'}
          </button>
        </form>
      </div>
    </div>
  );
}
