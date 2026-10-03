import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSchoolBySlug, listClasses } from '@/lib/schools';
import type { School, SchoolClass } from '@/types';

export default function SchoolLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [school, setSchool] = useState<School | null | undefined>(undefined);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    if (!slug) return;
    getSchoolBySlug(slug).then(setSchool);
    listClasses(slug).then((c) => setClasses(c.filter((x) => !x.archived)));
  }, [slug]);

  if (school === undefined) {
    return <p className="p-8 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (school === null) {
    return <p className="p-8 text-center text-sm text-slate-500">We couldn't find that school.</p>;
  }

  const color = school.branding.primaryColor;

  return (
    <div className="min-h-screen" style={{ ['--brand-600' as string]: color }}>
      <header className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ background: `${color}14` }}>
        {school.branding.logoUrl ? (
          <img src={school.branding.logoUrl} alt={school.name} className="h-20 w-20 rounded-full object-cover shadow" />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-semibold text-white shadow"
            style={{ background: color }}
          >
            {school.name[0]}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-800">{school.name}</h1>
        {school.branding.welcomeText && <p className="max-w-md text-sm text-slate-600">{school.branding.welcomeText}</p>}
        <Link to="/login" className="btn-primary mt-2">
          Parent / Teacher login
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Classes</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-slate-500">Classes will be listed here soon.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.id} className="card p-4">
                <p className="font-medium text-slate-800">{c.name}</p>
                {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>

      {(school.email || school.phone || school.address) && (
        <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">
          {school.email && <p>{school.email}</p>}
          {school.phone && <p>{school.phone}</p>}
          {school.address && <p>{school.address}</p>}
        </footer>
      )}
    </div>
  );
}
