import { useEffect, useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listAllSchools, createSchoolWithAdmin, slugify, isSlugTaken } from '@/lib/schools';
import type { School } from '@/types';

const emptyForm = { name: '', slug: '', adminName: '', adminEmail: '' };

export default function SuperAdminDashboard() {
  const { logout, profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    setLoading(true);
    try {
      setSchools(await listAllSchools());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function onNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }));
  }

  async function handleCreate() {
    setError('');
    if (!form.name.trim() || !form.slug.trim() || !form.adminEmail.trim()) {
      setError('School name, URL, and admin email are required.');
      return;
    }
    setSaving(true);
    try {
      if (await isSlugTaken(form.slug)) {
        setError(`"${form.slug}" is already taken — choose a different URL.`);
        return;
      }
      await createSchoolWithAdmin(form);
      setOpen(false);
      setForm(emptyForm);
      setSlugEdited(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create school.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Schools</h1>
          <p className="text-sm text-slate-500">Signed in as {profile?.email}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add school
          </button>
          <button className="btn-secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : schools.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No schools yet. Add the first one above.</p>
        ) : (
          schools.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {s.branding?.logoUrl ? (
                  <img src={s.branding.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: s.branding?.primaryColor ?? '#16a34a' }}
                  >
                    {s.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">/s/{s.slug} · {s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {s.subscriptionPlan}
                </span>
                <a className="btn-secondary !px-2 !py-1" href={`/s/${s.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Add school</h2>
            <div className="space-y-3">
              <div>
                <label className="label">School name</label>
                <input className="input" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
              </div>
              <div>
                <label className="label">URL (diinislaam.com/s/…)</label>
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm({ ...form, slug: slugify(e.target.value) });
                  }}
                />
              </div>
              <div>
                <label className="label">School admin's name</label>
                <input className="input" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
              </div>
              <div>
                <label className="label">School admin's email</label>
                <input
                  className="input"
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">They'll get an email to set their own password.</p>
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create school'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
