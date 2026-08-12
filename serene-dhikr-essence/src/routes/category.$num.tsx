import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Heart, Minus, Pause, Play, Plus, Repeat, RotateCcw, Share2, Volume2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArabicAudioButton } from "@/components/ArabicAudio";
import { chapterById, chapters } from "@/data/hisnul";
import { useFavorites } from "@/lib/favorites";
import { useChapterAudio } from "@/hooks/useChapterAudio";
import { fmt, rangeForDua, urlsForChapter } from "@/lib/audio";

export const Route = createFileRoute("/category/$num")({
  component: CategoryPage,
  loader: ({ params }) => {
    const chapter = chapterById(Number(params.num));
    if (!chapter) throw notFound();
    return chapter;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.oromoTitle} — Hisnul Muslim` },
          { name: "description", content: loaderData.oromoTitle },
        ]
      : [],
  }),
});

// A "topic header" is an entry that's actually the title of an embedded
// sub-chapter (e.g. "2 ــ دعاء لبس الثوب" / "Du'aa'ii huccuu uffachuu"),
// not a quoted du'a. Detect by absence of opening quote/paren and a leading
// numeric+dash pattern in the Arabic.
function isTopicHeader(d: { arabic: string; oromo: string }) {
  const a = d.arabic.trimStart();
  if (a.startsWith("(") || a.startsWith("«") || a.startsWith("\"")) return false;
  return /\d+\s*[ـ\-]+/.test(a);
}

function TopicHeader({ arabic, oromo }: { arabic: string; oromo: string }) {
  const cleanArabic = arabic.replace(/^\s*\d+\.?\s*/, "");
  return (
    <div className="animate-fade-in rounded-2xl border-l-4 border-gold bg-accent/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Mata-duree</p>
      <p
        className="mt-1 font-display text-base font-semibold text-foreground"
        style={{ fontSize: "calc(1rem * var(--reading-scale, 1))" }}
      >
        {oromo}
      </p>
      <p
        className="font-arabic mt-1 text-gold"
        style={{ fontSize: "calc(1.15rem * var(--reading-scale, 1))" }}
        lang="ar"
        dir="rtl"
      >
        {cleanArabic}
      </p>
    </div>
  );
}


function CategoryPage() {
  const chapter = Route.useLoaderData();
  const prev = chapters[chapters.findIndex((c) => c.num === chapter.num) - 1];
  const next = chapters[chapters.findIndex((c) => c.num === chapter.num) + 1];
  const { isFavorite, toggle } = useFavorites();
  const urls = urlsForChapter(chapter.num);
  const audio = useChapterAudio(urls);

  return (
    <AppShell>
      <header className="animate-fade-in">
        <Link
          to="/categories"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Gosoota
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              #{String(chapter.num).padStart(3, "0")}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-foreground">
              {chapter.oromoTitle}
            </h1>
            <p
              className="font-arabic mt-1 text-lg text-gold"
              lang="ar"
              dir="rtl"
            >
              {chapter.arabicTitle}
            </p>
          </div>
          <button
            onClick={() => toggle(chapter.num)}
            aria-label="Bookmark"
            className={`glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
              isFavorite(chapter.num) ? "text-gold" : "text-muted-foreground"
            }`}
          >
            <Heart
              className="h-5 w-5"
              fill={isFavorite(chapter.num) ? "currentColor" : "none"}
            />
          </button>
        </div>
      </header>

      <section className="mt-6 space-y-5">
        {(() => {
          let n = 0;
          return chapter.duas.map((d: { arabic: string; oromo: string }, i: number) => {
            if (isTopicHeader(d)) {
              return <TopicHeader key={i} arabic={d.arabic} oromo={d.oromo} />;
            }
            n += 1;
            const range = rangeForDua(chapter.num, i) ?? { start: n - 1, end: n - 1 };
            const inRange = audio.idx >= range.start && audio.idx <= range.end;
            const isPlaying = audio.playing && inRange;
            const isLoadingThis = audio.loading && inRange;
            return (
              <DuaCard
                key={i}
                idx={n}
                arabic={d.arabic}
                oromo={d.oromo}
                chapterTitle={chapter.oromoTitle}
                isPlaying={isPlaying}
                isLoading={isLoadingThis}
                isActive={isPlaying || isLoadingThis}
                current={audio.current}
                duration={audio.duration}
                progress={audio.progress}
                onSeek={audio.seek}
                onTogglePlay={() => {
                  if (isPlaying) audio.pause();
                  else audio.play(range.start);
                }}
              />

            );
          });
        })()}
      </section>


      <nav className="mt-8 flex items-center justify-between gap-3">
        {prev ? (
          <Link
            to="/category/$num"
            params={{ num: String(prev.num) }}
            className="glass flex flex-1 items-center gap-2 rounded-2xl px-4 py-3 text-sm text-foreground hover:text-gold"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="truncate">{prev.oromoTitle}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/category/$num"
            params={{ num: String(next.num) }}
            className="glass flex flex-1 items-center justify-end gap-2 rounded-2xl px-4 py-3 text-sm text-foreground hover:text-gold"
          >
            <span className="truncate">{next.oromoTitle}</span>
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Link>
        ) : null}
      </nav>
    </AppShell>
  );
}

function DuaCard({
  idx,
  arabic,
  oromo,
  chapterTitle,
  isPlaying,
  isLoading,
  isActive,
  current,
  duration,
  progress,
  onSeek,
  onTogglePlay,
}: {
  idx: number;
  arabic: string;
  oromo: string;
  chapterTitle: string;
  isPlaying: boolean;
  isLoading: boolean;
  isActive: boolean;
  current: number;
  duration: number;
  progress: number;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}) {
  const [count, setCount] = useState(0);

  const share = async () => {
    const text = `${arabic}\n\n${oromo}\n\n— Hisnul Muslim`;
    if (navigator.share) {
      try { await navigator.share({ title: chapterTitle, text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
  };


  return (
    <article className={`glass animate-fade-in rounded-3xl p-5 shadow-sm transition ${isPlaying ? "ring-1 ring-gold/40" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          {idx}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Dhaabi" : "Sagalee dhageeffadhu"}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-gold)] transition ${isPlaying ? "scale-105" : ""}`}
            style={{ background: "var(--gradient-gold)" }}
          >
            {isLoading ? (
              <Volume2 className="h-3.5 w-3.5 animate-pulse" />
            ) : isPlaying ? (
              <Pause className="h-3.5 w-3.5" fill="currentColor" />
            ) : (
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            )}
          </button>
          <ArabicAudioButton text={arabic} />
          <button
            onClick={share}
            aria-label="Share"
            className="text-muted-foreground transition hover:text-gold"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="block w-full cursor-pointer"
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
            <span>{fmt(duration)}</span>
          </div>
        </div>
      )}


      <p
        className="font-arabic mt-4 whitespace-pre-line leading-[2.3] text-foreground"
        style={{ fontSize: "calc(1.55rem * var(--reading-scale, 1))" }}
        lang="ar"
        dir="rtl"
      >
        {arabic}
      </p>

      {oromo && (
        <p
          className="mt-4 whitespace-pre-line border-t border-border/60 pt-4 leading-relaxed text-muted-foreground"
          style={{ fontSize: "calc(0.95rem * var(--reading-scale, 1))" }}
        >
          {oromo}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-accent/60 p-2 pl-4">
        <span className="text-xs font-medium uppercase tracking-wider text-accent-foreground/80">
          Lakkooftuu
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCount(0)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"
            aria-label="-"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center font-display text-lg font-semibold tabular-nums text-foreground">
            {count}
          </span>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
            aria-label="+"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
