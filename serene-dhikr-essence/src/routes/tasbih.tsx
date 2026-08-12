import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/tasbih")({
  component: TasbihPage,
  head: () => ({
    meta: [
      { title: "Tasbiih — Hisnul Muslim" },
      { name: "description", content: "Lakkooftuu zikrii — dijiitaalaa, salphaa, gammachiisaa." },
    ],
  }),
});

const PRESETS = [
  { label: "SubḥānAllāh", arabic: "سُبْحَانَ اللَّهِ", target: 33 },
  { label: "Alḥamdulillāh", arabic: "الحَمْدُ لِلَّهِ", target: 33 },
  { label: "Allāhu akbar", arabic: "اللَّهُ أَكْبَرُ", target: 34 },
  { label: "Lā ilāha illā Allāh", arabic: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
  { label: "Astaghfirullāh", arabic: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
  { label: "Ṣall Allāhu ʿalā Muḥammad", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", target: 100 },
];

const STORE = "hisn:tasbih:v1";

function TasbihPage() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [count, setCount] = useState(0);
  const preset = PRESETS[presetIdx];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw);
        setPresetIdx(s.presetIdx ?? 0);
        setCount(s.count ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ presetIdx, count })); } catch {}
  }, [presetIdx, count]);

  const progress = useMemo(
    () => Math.min(100, (count / preset.target) * 100),
    [count, preset.target],
  );
  const round = Math.floor(count / preset.target);
  const inRound = count % preset.target;

  const playChime = () => {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      // Two-tone bell: A5 -> E6
      [
        { f: 880, t: 0 },
        { f: 1318.5, t: 0.18 },
      ].forEach(({ f, t }) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.9);
        o.connect(g).connect(ctx.destination);
        o.start(now + t);
        o.stop(now + t + 0.95);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch {}
  };

  const tap = () => {
    if (count >= preset.target) return; // stop at target
    const next = count + 1;
    setCount(next);
    const vibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
    if (next === preset.target) {
      if (vibrate) navigator.vibrate([60, 50, 60, 50, 200]);
      playChime();
    } else if (vibrate) {
      navigator.vibrate(12);
    }
  };

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Tasbiih</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          Lakkooftuu <span className="gold-text">Zikrii</span>
        </h1>
      </header>

      {/* Preset chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => { setPresetIdx(i); setCount(0); }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
              i === presetIdx
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Counter */}
      <section className="glass mt-6 rounded-3xl p-6 text-center">
        <p className="font-arabic text-3xl text-gold" lang="ar" dir="rtl">
          {preset.arabic}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {round > 0 ? `Cikkii ${round} • ` : ""}
          {inRound} / {preset.target}
        </p>

        {/* Progress ring */}
        <div className="relative mx-auto mt-6 h-56 w-56">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#g)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 276.46} 276.46`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" />
                <stop offset="100%" stopColor="var(--primary-glow)" />
              </linearGradient>
            </defs>
          </svg>
          <button
            onClick={tap}
            className="absolute inset-4 rounded-full text-primary-foreground shadow-[var(--shadow-elegant)] transition active:scale-95"
            style={{ background: "var(--gradient-primary)" }}
          >
            <span className="block font-display text-6xl font-semibold tabular-nums">
              {count}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-gold-soft">
              Tuqi
            </span>
          </button>
        </div>

        <button
          onClick={() => setCount(0)}
          className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-xs font-medium text-foreground hover:border-gold hover:text-gold"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Irra deebi'i
        </button>
      </section>
    </AppShell>
  );
}
