import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Repeat, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { chapters } from "@/data/hisnul";
import { fmt, urlsForChapter } from "@/lib/audio";

export const Route = createFileRoute("/sagalee")({
  component: SagaleePage,
  head: () => ({
    meta: [
      { title: "Sagalee — Hisnul Muslim" },
      { name: "description", content: "Sagalee du'aa Hisnul Muslim" },
    ],
  }),
});

// Each chapter plays its du'a tracks consecutively (from the original source).
const urlsFor = (num: number) => urlsForChapter(num);


function SagaleePage() {
  const [playingNum, setPlayingNum] = useState<number | null>(null);
  const [loadingNum, setLoadingNum] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<{ chapter: number; urls: string[]; idx: number } | null>(null);
  const repeatRef = useRef(false);
  const advancingRef = useRef(false);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  const preloadNext = useCallback(() => {
    const q = queueRef.current;
    const p = preloadRef.current;
    if (!q || !p) return;
    const nextIdx = q.idx + 1;
    const nextUrl =
      nextIdx < q.urls.length
        ? q.urls[nextIdx]
        : repeatRef.current
          ? q.urls[0]
          : null;
    if (!nextUrl) {
      p.removeAttribute("src");
      return;
    }
    if (p.src !== nextUrl) {
      p.src = nextUrl;
      try { p.load(); } catch {}
    }
  }, []);

  const advance = useCallback(() => {
    const a = audioRef.current;
    const q = queueRef.current;
    if (!a || !q || advancingRef.current) return;

    const atEnd = q.idx >= q.urls.length - 1;
    if (atEnd && !repeatRef.current) {
      queueRef.current = null;
      setPlayingNum(null);
      setProgress(0);
      setCurrent(0);
      setDuration(0);
      return;
    }

    advancingRef.current = true;
    q.idx = atEnd ? 0 : q.idx + 1;
    a.src = q.urls[q.idx];
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    try { a.load(); } catch {}
    a.play()
      .catch(() => {
        setPlayingNum(null);
        setLoadingNum(null);
        queueRef.current = null;
      })
      .finally(() => {
        advancingRef.current = false;
        preloadNext();
      });
  }, [preloadNext]);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";

    const p = new Audio();
    p.preload = "auto";
    p.crossOrigin = "anonymous";
    p.muted = true;

    const onEnded = () => advance();
    const onError = () => {
      // Try to recover by advancing instead of stalling
      if (queueRef.current) {
        advance();
      } else {
        setPlayingNum(null);
        setLoadingNum(null);
      }
    };
    const onPlaying = () => setLoadingNum(null);
    const onLoadedMeta = () => setDuration(a.duration || 0);
    const onTimeUpdate = () => {
      setCurrent(a.currentTime);
      if (a.duration > 0) setProgress((a.currentTime / a.duration) * 100);
      // Watchdog: some streams don't fire `ended` reliably (esp. archive.org).
      // If we're within 0.35s of the end and not already advancing, force advance.
      if (
        a.duration > 0 &&
        a.currentTime >= a.duration - 0.35 &&
        !a.seeking &&
        !advancingRef.current &&
        queueRef.current
      ) {
        advance();
      }
    };

    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    a.addEventListener("stalled", () => { /* ignore — let timeupdate watchdog handle */ });
    a.addEventListener("playing", onPlaying);
    a.addEventListener("loadedmetadata", onLoadedMeta);
    a.addEventListener("timeupdate", onTimeUpdate);

    audioRef.current = a;
    preloadRef.current = p;
    return () => {
      a.pause();
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("loadedmetadata", onLoadedMeta);
      a.removeEventListener("timeupdate", onTimeUpdate);
      audioRef.current = null;
      preloadRef.current = null;
    };
  }, [advance]);

  const toggle = async (num: number, index: number) => {
    const a = audioRef.current;
    if (!a) return;
    if (playingNum === num) {
      a.pause();
      setPlayingNum(null);
      return;
    }
    a.pause();
    const urls = urlsFor(num);
    if (!urls.length) return;
    queueRef.current = { chapter: num, urls, idx: 0 };
    a.src = urls[0];
    setLoadingNum(num);
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    try { a.load(); } catch {}
    try {
      await a.play();
      setPlayingNum(num);
      preloadNext();
    } catch {
      setLoadingNum(null);
      queueRef.current = null;
    }
  };

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Audio</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            <span className="gold-text">Sagalee</span> Du'aa
          </h1>
          <button
            type="button"
            onClick={() => setRepeat((r) => !r)}
            aria-pressed={repeat}
            aria-label={repeat ? "Repeat on" : "Repeat off"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
              repeat
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Irra deebi'i</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Sagalee du'aa dhaggeeffadhu. Tuqi ▶︎ jalqabuuf.
        </p>
      </header>

      <ul className="mt-6 space-y-2">
        {chapters.map((c, index) => {
          const isPlaying = playingNum === c.num;
          const isLoading = loadingNum === c.num;
          const isActive = isPlaying || isLoading;
          return (
            <li
              key={c.num}
              className="glass animate-fade-in rounded-2xl p-3"
            >
              <button
                type="button"
                onClick={() => toggle(c.num, index)}
                aria-label={isPlaying ? `Pause ${c.oromoTitle}` : `Play ${c.oromoTitle}`}
                className="flex w-full items-center gap-3 text-left transition active:scale-[0.99]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-gold)]"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  {isLoading ? (
                    <Volume2 className="h-5 w-5 animate-pulse" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  ) : (
                    <Play className="h-5 w-5" fill="currentColor" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-semibold text-foreground">
                    {c.oromoTitle}
                  </span>
                  <span
                    className="font-arabic block truncate text-xs text-muted-foreground"
                    lang="ar"
                    dir="rtl"
                  >
                    {c.arabicTitle}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                  #{String(c.num).padStart(3, "0")}
                </span>
              </button>
              {isActive && (
                <div className="mt-3 space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={current}
                    onChange={(e) => {
                      const a = audioRef.current;
                      const t = Number(e.target.value);
                      if (a && isFinite(t)) {
                        a.currentTime = t;
                        setCurrent(t);
                      }
                    }}
                    className="block w-full cursor-pointer accent-[color:var(--gold)]"
                    style={{
                      background: `linear-gradient(to right, var(--gold) ${progress}%, color-mix(in oklab, var(--primary) 20%, transparent) ${progress}%)`,
                      height: "6px",
                      borderRadius: "9999px",
                      WebkitAppearance: "none",
                      appearance: "none",
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{fmt(current)}</span>
                    <span>
                      {queueRef.current && queueRef.current.urls.length > 1
                        ? `${queueRef.current.idx + 1}/${queueRef.current.urls.length} · `
                        : ""}
                      {fmt(duration)}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
