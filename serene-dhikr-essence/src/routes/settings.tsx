import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Type, Info, Mail, Heart, Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useFontScale } from "@/components/FontSizeControl";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Qindaa'ina — Hisnul Muslim" },
      { name: "description", content: "Qindaa'ina appii: bocaa, halluu, fi waa'ee." },
    ],
  }),
});

const THEME_KEY = "hisn:theme:v1";

function loadTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "dark" || v === "light") return v;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);
  return { theme, setTheme };
}

function SettingsPage() {
  const { scale, inc, dec, reset } = useFontScale();
  const { theme, setTheme } = useTheme();

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Qindaa'ina</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          App <span className="gold-text">qindeessi</span>
        </h1>
      </header>

      {/* Theme */}
      <section className="glass mt-6 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>Halluu (Theme)</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              theme === "light"
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            <Sun className="h-4 w-4" /> Ifaa
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              theme === "dark"
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            <Moon className="h-4 w-4" /> Dukkanaa'aa
          </button>
        </div>
      </section>

      {/* Font size */}
      <section className="glass mt-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Type className="h-4 w-4" />
          <span>Guddina bocaa</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={dec}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-accent"
          >
            −
          </button>
          <span className="font-display text-lg font-semibold tabular-nums text-foreground">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={inc}
            className="rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            +
          </button>
        </div>
        <button
          onClick={reset}
          className="mt-2 w-full rounded-xl border border-border bg-transparent px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Deebisi gara 100%
        </button>
      </section>

      {/* About */}
      <section className="glass mt-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4" />
          <span>Waa'ee Appii</span>
        </div>
        <div className="mt-3 space-y-3 text-sm text-foreground/90 leading-relaxed">
          <p>
            Appiin kun <span className="font-semibold gold-text">Hisnul Muslim</span> —
            kitaaba zikriifi du'aa'ii Musliimaa, Afaan Oromootiin akka salphaatti
            dubbifamuufi dhaggeeffatamu kan qopha'e dha.
          </p>
          <p>
            Kitaabni <a href="https://islamhouse.com" target="_blank" rel="noreferrer" className="gold-text underline">islamhouse.com</a> irraahi.
          </p>
          <p>
            Audio immoo <a href="https://archive.org" target="_blank" rel="noreferrer" className="gold-text underline">archive.org</a> irraahi.
          </p>
          <p>
            Hojii fi qopheessuun appichaa <span className="font-semibold">Feysel Mustefa</span>{" "}
            tiin gaggeeffame. Akka aakhiraatti hojii gaarii naa galmeessu, namni fayyadame
            <span className="font-semibold"> du'aa'ii </span>
            naaf akka godhu kabajaan gaafadha.
          </p>
          <p className="text-muted-foreground">
            Yaada, dogoggora, ykn fooyya'iinsaaf:
          </p>
          <a
            href="mailto:fes900@yahoo.com?subject=Hisnul%20Muslim%20App%20Feedback"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elegant)]"
          >
            <Mail className="h-4 w-4" />
            fes900@yahoo.com
          </a>
        </div>
      </section>

      {/* Share / Other */}
      <section className="glass mt-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Heart className="h-4 w-4" />
          <span>Appii biroo / Qoodi</span>
        </div>
        <div className="mt-3 grid gap-2">
          <button
            onClick={async () => {
              const url = typeof window !== "undefined" ? window.location.origin : "";
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: "Hisnul Muslim",
                    text: "Zikriifi du'aa'ii Musliimaa Afaan Oromootiin.",
                    url,
                  });
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(url);
                }
              } catch {}
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-accent"
          >
            <Share2 className="h-4 w-4" /> Hiriyyootatti qoodi
          </button>
          <a
            href="mailto:fes900@yahoo.com?subject=App%20Suggestion"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Appii biroo gaafadhu
          </a>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} — Feysel Mustefa
        </p>
      </section>
    </AppShell>
  );
}
