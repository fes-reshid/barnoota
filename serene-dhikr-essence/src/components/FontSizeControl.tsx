import { useEffect, useState } from "react";
import { Type, Minus, Plus } from "lucide-react";

const KEY = "hisn:fontscale:v1";
const MIN = 0.8;
const MAX = 1.8;
const STEP = 0.1;

function load(): number {
  if (typeof window === "undefined") return 1;
  const v = parseFloat(localStorage.getItem(KEY) || "1");
  return Number.isFinite(v) ? Math.min(MAX, Math.max(MIN, v)) : 1;
}

export function useFontScale() {
  const [scale, setScale] = useState<number>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, String(scale)); } catch {}
    document.documentElement.style.setProperty("--reading-scale", String(scale));
  }, [scale]);
  return {
    scale,
    inc: () => setScale((s) => Math.min(MAX, +(s + STEP).toFixed(2))),
    dec: () => setScale((s) => Math.max(MIN, +(s - STEP).toFixed(2))),
    reset: () => setScale(1),
  };
}

export function FontSizeControl() {
  const { scale, inc, dec } = useFontScale();
  return (
    <div className="glass flex items-center gap-1 rounded-full p-1 pl-3">
      <Type className="h-3.5 w-3.5 text-muted-foreground" />
      <button
        onClick={dec}
        aria-label="Xiqqeessi"
        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-accent"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2.2rem] text-center font-display text-xs font-semibold tabular-nums text-foreground">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={inc}
        aria-label="Guddisi"
        className="flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-gold)" }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
