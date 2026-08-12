import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryCard } from "@/components/CategoryCard";
import { chapters } from "@/data/hisnul";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [{ title: "Filannoo — Hisnul Muslim" }] }),
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const favs = chapters.filter((c) => ids.includes(c.num));

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Bookmarks</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          Filannoo <span className="gold-text">Kee</span>
        </h1>
      </header>

      {favs.length === 0 ? (
        <div className="glass mt-8 rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-gold" style={{ background: "color-mix(in oklab, var(--gold) 15%, transparent)" }}>
            <Heart className="h-6 w-6" />
          </div>
          <p className="mt-4 font-display text-lg text-foreground">Hin jiru</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gosa fudhachuuf, ♡ tuqi.
          </p>
          <Link
            to="/categories"
            className="mt-5 inline-block rounded-full px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Gosoota ilaali
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {favs.map((c) => (
            <CategoryCard key={c.num} chapter={c} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
