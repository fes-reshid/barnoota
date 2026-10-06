import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

/**
 * A self-contained walkthrough of the Super Admin / School Admin / public
 * page flow, seeded with sample schools. Deliberately has zero dependency
 * on Firebase or AuthContext — it has to work even before a real Firebase
 * project is wired up, so it's always safe to link people to /demo.
 * Nothing here is persisted; state resets on reload.
 */

const COLORS = ['#16a34a', '#b8873b', '#2563eb', '#be185d', '#57534e'];

interface DemoSchool {
  id: string;
  name: string;
  email: string;
  color: string;
  logo: string | null;
  welcome: string;
  classes: string[];
}

const SEED: DemoSchool[] = [
  {
    id: 'noor-weekend-school',
    name: 'Noor Weekend School',
    email: 'admin@noorweekend.org',
    color: '#16a34a',
    logo: null,
    welcome: "Welcome to Noor Weekend School — nurturing Qur'an, character and community.",
    classes: ['Tuhfatul Atfaal', 'Iqra'],
  },
  {
    id: 'al-huda-academy',
    name: 'Al-Huda Academy',
    email: 'office@alhudaacademy.org',
    color: '#b8873b',
    logo: null,
    welcome: 'A warm welcome to our Al-Huda families.',
    classes: ['Seerah', 'Riyaadu Saalihiin', 'Arabic 1'],
  },
];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function Avatar({ school, size = 36 }: { school: DemoSchool; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: school.color, fontSize: size * 0.4 }}
    >
      {school.logo ? (
        <img src={school.logo} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(school.name)
      )}
    </div>
  );
}

type Step = 'admin' | 'school' | 'public';

export default function DemoPage() {
  const [schools, setSchools] = useState<DemoSchool[]>(SEED);
  const [activeId, setActiveId] = useState(SEED[0].id);
  const [step, setStep] = useState<Step>('admin');
  const [newClass, setNewClass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = schools.find((s) => s.id === activeId) ?? schools[0];

  function patchActive(patch: Partial<DemoSchool>) {
    setSchools((prev) => prev.map((s) => (s.id === activeId ? { ...s, ...patch } : s)));
  }

  function handleCreateSchool(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const slugInput = (form.elements.namedItem('slug') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!name || !email) return;
    let slug = slugify(slugInput) || slugify(name);
    if (schools.some((s) => s.id === slug)) slug = `${slug}-2`;
    const school: DemoSchool = {
      id: slug,
      name,
      email,
      color: COLORS[schools.length % COLORS.length],
      logo: null,
      welcome: `A warm welcome from ${name}.`,
      classes: [],
    };
    setSchools((prev) => [...prev, school]);
    setActiveId(slug);
    form.reset();
    setStep('school');
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchActive({ logo: reader.result as string });
    reader.readAsDataURL(file);
  }

  function handleAddClass(e: FormEvent) {
    e.preventDefault();
    if (!newClass.trim()) return;
    patchActive({ classes: [...active.classes, newClass.trim()] });
    setNewClass('');
  }

  function removeClass(idx: number) {
    patchActive({ classes: active.classes.filter((_, i) => i !== idx) });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <strong className="text-slate-700">Live demo</strong> — sample data only, nothing is saved
      </div>

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">School Platform</h1>
        <p className="mx-auto max-w-md text-sm text-slate-500">
          One login system, many schools — each with its own branding and classes, kept completely separate. Click
          through the three roles below.
        </p>
      </div>

      <nav className="mx-auto flex w-fit gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
        {([
          ['admin', '1 Platform Admin'],
          ['school', '2 School Admin'],
          ['public', '3 Public Page'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStep(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              step === key ? 'bg-brand-600 text-white' : 'text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {step === 'admin' && (
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Schools on the platform</h2>
            <p className="text-sm text-slate-500">
              You create a school and invite its admin. Each one gets its own login, branding, and class list.
            </p>
          </div>

          <div className="space-y-2">
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                  s.id === activeId ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <Avatar school={s} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">/s/{s.id} · {s.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Trial
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateSchool} className="space-y-3 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">School name</label>
                <input name="name" className="input" placeholder="e.g. Al-Furqan Academy" required />
              </div>
              <div>
                <label className="label">URL</label>
                <input name="slug" className="input" placeholder="al-furqan-academy" />
              </div>
            </div>
            <div>
              <label className="label">Admin's email</label>
              <input name="email" type="email" className="input" placeholder="admin@example.com" required />
            </div>
            <button type="submit" className="btn-primary">
              + Create school
            </button>
          </form>
        </section>
      )}

      {step === 'school' && (
        <section className="card space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{active.name} — Admin</h2>
            <p className="text-sm text-slate-500">Branding and classes here only ever affect this one school.</p>
          </div>

          <div className="flex items-center gap-4">
            <Avatar school={active} size={58} />
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Upload logo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">School name</label>
              <input className="input" value={active.name} onChange={(e) => patchActive({ name: e.target.value })} />
            </div>
            <div>
              <label className="label">Theme color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-10 rounded border border-slate-300"
                  value={active.color}
                  onChange={(e) => patchActive({ color: e.target.value })}
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patchActive({ color: c })}
                      className="h-5 w-5 rounded-full border-2"
                      style={{ background: c, borderColor: active.color === c ? '#1e293b' : 'transparent' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Welcome text (shown on the public page)</label>
            <input
              className="input"
              value={active.welcome}
              onChange={(e) => patchActive({ welcome: e.target.value })}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Classes</h3>
            <div className="divide-y divide-slate-100">
              {active.classes.length === 0 && <p className="py-2 text-sm text-slate-500">No classes yet.</p>}
              {active.classes.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-sm text-slate-800">
                  <span>{c}</span>
                  <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => removeClass(idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddClass} className="mt-3 flex gap-2">
              <input
                className="input"
                placeholder="e.g. Tuhfatul Atfaal"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">
                Add
              </button>
            </form>
          </div>
        </section>
      )}

      {step === 'public' && (
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">What visitors see</h2>
            <p className="text-sm text-slate-500">No login needed — this is the page a school links to from their own website.</p>
          </div>
          <p className="mx-auto w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-500">
            diinislaam.com/s/{active.id}
          </p>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div
              className="flex flex-col items-center gap-2 px-6 py-10 text-center"
              style={{ background: `${active.color}18` }}
            >
              <Avatar school={active} size={64} />
              <h3 className="text-xl font-semibold text-slate-800">{active.name}</h3>
              <p className="max-w-sm text-sm text-slate-600">{active.welcome}</p>
              <button className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: active.color }}>
                Parent / Teacher login
              </button>
            </div>
            <div className="px-6 py-5">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Classes</h4>
              {active.classes.length === 0 ? (
                <p className="text-sm text-slate-500">Classes will be listed here soon.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {active.classes.map((c, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-3 text-center text-xs text-slate-500">{active.email}</div>
          </div>
        </section>
      )}

      <p className="mx-auto max-w-md text-center text-xs text-slate-400">
        This mirrors the real School Platform app — same flow, demo data instead of a live database.
      </p>
    </div>
  );
}
