import type { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'rose' | 'slate' | 'sky' | 'violet';

const TONES: Record<Tone, string> = {
  green: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
  sky: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
};

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}
