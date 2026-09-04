import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'brand' | 'amber' | 'rose' | 'sky' | 'violet';
  hint?: string;
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
};

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className={`rounded-xl p-3 ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
