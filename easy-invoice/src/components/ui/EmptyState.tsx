import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="rounded-full bg-brand-50 p-3">
        <Icon className="h-7 w-7 text-brand-600" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink-500">{description}</p>
      {action}
    </div>
  );
}
