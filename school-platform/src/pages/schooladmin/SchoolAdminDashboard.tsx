import { useEffect, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/firebase/config';
import { getSchoolBySlug, updateSchoolBranding, listClasses, createClass, updateClass } from '@/lib/schools';
import type { School, SchoolClass } from '@/types';

export default function SchoolAdminDashboard() {
  const { profile, logout } = useAuth();
  const schoolId = profile?.schoolIds?.[0];

  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [newClassName, setNewClassName] = useState('');

  async function reload() {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [s, c] = await Promise.all([getSchoolBySlug(schoolId), listClasses(schoolId)]);
      setSchool(s);
      setClasses(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleSaveBranding() {
    if (!school) return;
    setSaving(true);
    setSavedMsg('');
    try {
      await updateSchoolBranding(school.id, {
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        branding: school.branding,
      });
      setSavedMsg('Saved.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!school || !storage) return;
    const path = `schools/${school.id}/logo-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setSchool({ ...school, branding: { ...school.branding, logoUrl: url } });
  }

  async function handleAddClass() {
    if (!school || !newClassName.trim()) return;
    await createClass(school.id, { name: newClassName.trim() });
    setNewClassName('');
    await reload();
  }

  async function handleArchiveClass(c: SchoolClass) {
    if (!school) return;
    await updateClass(school.id, c.id, { archived: !c.archived });
    await reload();
  }

  if (!schoolId) {
    return <p className="p-6 text-sm text-slate-500">Your account isn't linked to a school yet.</p>;
  }
  if (loading || !school) {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{school.name}</h1>
          <p className="text-sm text-slate-500">diinislaam.com/s/{school.slug}</p>
        </div>
        <button className="btn-secondary" onClick={logout}>
          Sign out
        </button>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Branding</h2>
        <div className="mb-4 flex items-center gap-4">
          {school.branding.logoUrl ? (
            <img src={school.branding.logoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{ background: school.branding.primaryColor }}
            >
              {school.name[0]}
            </div>
          )}
          <label className="btn-secondary cursor-pointer">
            <Upload className="h-4 w-4" /> Upload logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">School name</label>
            <input className="input" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Theme color</label>
            <input
              className="input h-10"
              type="color"
              value={school.branding.primaryColor}
              onChange={(e) => setSchool({ ...school, branding: { ...school.branding, primaryColor: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">Contact email</label>
            <input className="input" type="email" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={school.phone ?? ''} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={school.address ?? ''} onChange={(e) => setSchool({ ...school, address: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Welcome text (shown on your public page)</label>
            <input
              className="input"
              value={school.branding.welcomeText ?? ''}
              onChange={(e) => setSchool({ ...school, branding: { ...school.branding, welcomeText: e.target.value } })}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={handleSaveBranding} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Classes</h2>
        <div className="mb-4 flex gap-2">
          <input
            className="input"
            placeholder="e.g. Tuhfatul Atfaal"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button className="btn-primary shrink-0" onClick={handleAddClass}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {classes.length === 0 && <p className="py-3 text-sm text-slate-500">No classes yet.</p>}
          {classes.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <span className={c.archived ? 'text-sm text-slate-400 line-through' : 'text-sm text-slate-800'}>{c.name}</span>
              <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => handleArchiveClass(c)}>
                {c.archived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
