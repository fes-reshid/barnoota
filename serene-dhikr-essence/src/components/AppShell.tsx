import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { FontSizeControl } from "./FontSizeControl";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-xl px-5 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link
            to="/search"
            aria-label="Barbaadi"
            className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Barbaadi</span>
          </Link>
          <FontSizeControl />
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
