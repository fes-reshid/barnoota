import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { Chapter } from "@/data/hisnul";

export function CategoryCard({ chapter, variant = "default" }: { chapter: Chapter; variant?: "default" | "featured" }) {
  if (variant === "featured") {
    return (
      <Link
        to="/category/$num"
        params={{ num: String(chapter.num) }}
        className="group relative block overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-0.5"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold-soft/90">
            #{String(chapter.num).padStart(2, "0")}
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight">
            {chapter.oromoTitle}
          </h3>
          <p className="font-arabic mt-2 text-base text-gold-soft/95 line-clamp-1">
            {chapter.arabicTitle}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium opacity-90">
            {chapter.duas.length} du'aa'ii
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/category/$num"
      params={{ num: String(chapter.num) }}
      className="glass group flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-gold hover:shadow-[var(--shadow-gold)]"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        {chapter.num}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-foreground">{chapter.oromoTitle}</h3>
        <p className="font-arabic mt-0.5 truncate text-sm text-muted-foreground">
          {chapter.arabicTitle}
        </p>
      </div>
      <div className="text-[10px] font-medium text-muted-foreground">
        {chapter.duas.length}
      </div>
      <ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:text-gold" />
    </Link>
  );
}
