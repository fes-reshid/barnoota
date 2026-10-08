import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, Sparkles, Users, CalendarCheck, Wallet, FileSpreadsheet,
  ClipboardList, MessageCircle, Link2, Moon, Smartphone, IdCard, CheckCircle2, Printer,
} from 'lucide-react';
import { detectCurrency, pricingFor, currencySymbol } from '@/lib/pricing';

const PRICING_PLANS: Array<{
  key: 'trial' | 'basic' | 'standard' | 'premium';
  name: string;
  students: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    key: 'trial', name: 'Trial', students: 'Up to 30 students',
    features: ['Core modules: students, attendance, fees, exams, homework', '14 days, no card required'],
  },
  {
    key: 'basic', name: 'Basic', students: 'Up to 100 students',
    features: ['Everything in Trial', 'Email notifications', 'Parent self-registration invites'],
  },
  {
    key: 'standard', name: 'Standard', students: 'Up to 500 students', highlight: true,
    features: ['Everything in Basic', 'WhatsApp & Telegram notifications', 'Islamic studies modules', 'Custom branding on cards'],
  },
  {
    key: 'premium', name: 'Premium', students: 'Unlimited students',
    features: ['Everything in Standard', 'Unlimited students', 'Priority support'],
  },
];

const FEATURES: Array<{ icon: typeof Users; title: string; description: string }> = [
  { icon: Users, title: 'Students & staff', description: 'One record per student and teacher — profiles, classes, guardians, and printable photo ID cards, all in one place.' },
  { icon: CalendarCheck, title: 'Attendance', description: 'Mark attendance in seconds and spot patterns early, with automatic alerts when a student falls behind.' },
  { icon: Wallet, title: 'Fees & payments', description: 'Invoice by term or year level, record payments as they come in, and print a receipt on the spot.' },
  { icon: FileSpreadsheet, title: 'Exams & report cards', description: 'Record marks once and generate a clean, school-branded report card ready to print or send home.' },
  { icon: ClipboardList, title: 'Homework & timetable', description: 'Assign homework by class, track submissions, and keep every class on a shared weekly timetable.' },
  { icon: MessageCircle, title: 'Announcements & messaging', description: 'Reach the whole school, one class, or a single family — and message any parent directly.' },
  { icon: Link2, title: 'Parent self-registration', description: 'Send a one-tap invite link over WhatsApp, Telegram, or email — parents set up their own portal login.' },
  { icon: Smartphone, title: 'WhatsApp, Telegram & email', description: 'Every update — homework, attendance, fees, payments — can reach guardians on the channel they actually check.' },
  { icon: Moon, title: 'Islamic studies modules', description: 'Purpose-built tracking for Quran memorisation, Iqra, Islamic studies, and Oromo language progress.' },
];

const HIGHLIGHTS = [
  'Every role gets its own dashboard — admin, teacher, parent, and student',
  'Printable ID cards and report cards, school-branded automatically',
  'Runs on Firebase — your data, your project, no vendor lock-in',
];

export default function LandingPage() {
  const [currency] = useState(() => detectCurrency());
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const prices = pricingFor(currency);
  const symbol = currencySymbol(currency);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-base font-bold text-slate-900">Barnoota Campus</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/demo" className="btn-secondary !py-1.5 !px-3 text-sm">
              <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Live</span> Demo
            </Link>
            <Link to="/login" className="btn-primary !py-1.5 !px-3 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-brand-100"
          aria-hidden="true"
        />
        <div
          className="absolute left-1/2 top-[-120px] -z-10 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> All-in-one school management
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Run your school like <span className="text-brand-600">clockwork</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
              Students, attendance, fees, exams, homework, and family communication — one calm, simple
              dashboard your whole staff will actually enjoy using.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/demo" className="btn-primary w-full !px-6 !py-3 text-base sm:w-auto">
                Try the live demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary w-full !px-6 !py-3 text-base sm:w-auto">
                Sign in to your school
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">No signup required for the demo — click through every role instantly.</p>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-brand-900/10 sm:p-3">
              <div className="flex items-center gap-1.5 border-b border-slate-100 px-2 pb-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-4">
                {[
                  { label: 'Students', value: '36', icon: Users, tone: 'bg-brand-50 text-brand-700' },
                  { label: 'Attendance today', value: '94%', icon: CalendarCheck, tone: 'bg-sky-50 text-sky-700' },
                  { label: 'Fees collected', value: '$9,840', icon: Wallet, tone: 'bg-amber-50 text-amber-700' },
                  { label: 'Open invoices', value: '7', icon: FileSpreadsheet, tone: 'bg-rose-50 text-rose-700' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-100 p-4">
                    <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden rotate-6 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg sm:flex sm:items-center sm:gap-2">
              <IdCard className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-medium text-slate-700">ID cards, printed in one click</span>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden -rotate-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg sm:flex sm:items-center sm:gap-2">
              <Printer className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-medium text-slate-700">Report cards, school-branded</span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
          {HIGHLIGHTS.map((h) => (
            <div key={h} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
              <p className="text-sm text-slate-600">{h}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything your school needs</h2>
          <p className="mt-3 text-slate-600">
            Built for weekend schools, Islamic academies, and everyday K-12 — every module speaks to the
            same student record, so nothing's ever out of sync.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-slate-600">
              Start free, pay for what you grow into. No setup fees, cancel any time.
              {currency === 'AUD' && <span className="block text-xs text-slate-400 mt-1">Prices shown in AUD for Australia.</span>}
            </p>
            <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === 'yearly' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Yearly <span className="text-xs opacity-80">(2 months free)</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((plan) => {
              const price = plan.key === 'trial' ? null : prices[plan.key];
              const amount = price ? (billing === 'monthly' ? price.monthly : price.yearly) : 0;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 ${plan.highlight ? 'border-brand-500 shadow-lg ring-1 ring-brand-500' : 'border-slate-200 shadow-card'}`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{plan.students}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {price ? (
                      <>
                        <span className="text-3xl font-extrabold text-slate-900">{symbol}{amount.toLocaleString()}</span>
                        <span className="text-sm text-slate-500">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-extrabold text-slate-900">Free</span>
                    )}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/demo"
                    className={`mt-6 w-full text-center ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.key === 'trial' ? 'Start free trial' : 'Try the demo'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-14 text-center sm:px-16">
          <div
            className="absolute right-[-60px] top-[-60px] h-56 w-56 rounded-full bg-brand-500/30 blur-3xl"
            aria-hidden="true"
          />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">See it running, right now</h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">
            Jump into a full copy of the app — every role, every feature, pre-loaded with a real-looking
            school. No account needed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/demo" className="btn w-full bg-white !px-6 !py-3 text-base text-brand-700 hover:bg-brand-50 sm:w-auto">
              Try the live demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn w-full !px-6 !py-3 text-base text-white ring-1 ring-inset ring-white/40 hover:bg-white/10 sm:w-auto">
              Sign in to your school
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Barnoota Campus</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Barnoota Campus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
