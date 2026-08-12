import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryCard } from "@/components/CategoryCard";
import { searchChapters, chapters } from "@/data/hisnul";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "Barbaadi — Hisnul Muslim" }] }),
});

function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q ? searchChapters(q) : chapters), [q]);

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Barbaadi</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          Zikrii <span className="gold-text">barbaadi</span>
        </h1>
      </header>

      <div className="glass mt-5 flex items-center gap-2 rounded-2xl px-4 py-3">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Afaan Oromoo, Arabaa, ykn lakkoofsa…"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {results.length} bu'aa
      </p>

      <div className="mt-3 space-y-2">
        {results.slice(0, 60).map((c) => (
          <CategoryCard key={c.num} chapter={c} />
        ))}
      </div>
    </AppShell>
  );
}
