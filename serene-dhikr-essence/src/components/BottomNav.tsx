import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, CircleDot, Settings, Volume2 } from "lucide-react";

const items = [
  { to: "/categories", label: "Zikrii", icon: BookOpen },
  { to: "/tasbih", label: "Tasbiih", icon: CircleDot },
  { to: "/sagalee", label: "Sagalee", icon: Volume2 },
  { to: "/settings", label: "Qindaa'ina", icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-xl px-3 pb-3">
        <div className="glass rounded-3xl px-2 py-2 shadow-[var(--shadow-elegant)]">
          <ul className="grid grid-cols-4">
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <li key={to} className="flex">
                  <Link
                    to={to}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
