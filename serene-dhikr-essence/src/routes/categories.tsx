import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CategoryCard } from "@/components/CategoryCard";
import { chapters } from "@/data/hisnul";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
  head: () => ({
    meta: [
      { title: "Gosoota Zikrii — Hisnul Muslim" },
      { name: "description", content: "Gosoota zikrii fi du'aa'ii hundaa keessaa filadhu." },
    ],
  }),
});

function CategoriesPage() {
  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          Hundi {chapters.length}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          Gosoota <span className="gold-text">Zikrii</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lakkoofsi tartiiba kitaaba Hisnul Muslim hordofa.
        </p>
      </header>

      <div className="mt-6 space-y-2">
        {chapters.map((c) => (
          <CategoryCard key={c.num} chapter={c} />
        ))}
      </div>
    </AppShell>
  );
}
