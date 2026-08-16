import { chapters } from "@/data/hisnul";

export const audioUrl = (num: number) =>
  `https://archive.org/download/peacefulmankind_Hisnul_Muslim/n${num}.mp3`;

// Khawatim Surat Aali Imraan (ayat 3:190–200). These play from a separate
// recitation source (everyayah / Alafasy) and are bundled into a single
// du'a entry that expands to multiple sequential audio URLs.
const ALIMRAN_AYAH_URLS = Array.from({ length: 11 }, (_, i) => {
  const n = 190 + i;
  return `https://everyayah.com/data/Alafasy_128kbps/003${n}.mp3`;
});

function isTopicHeader(d: { arabic: string; oromo: string }) {
  const a = d.arabic.trimStart();
  if (a.startsWith("(") || a.startsWith("«") || a.startsWith("\"")) return false;
  return /\d+\s*[ـ\-]+/.test(a);
}

const isAlimranCombinedDua = (d: { arabic: string; oromo: string }) =>
  d.arabic.includes("خَلْقِ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَٱخْتِلَٰفِ");

// Adhan adkhaar (chapter #15): five sequential adhan-response du'as are
// displayed as one merged entry, but audio must still consume all 5 tracks
// so later chapters remain in order.

export type DuaRange = { start: number; end: number } | null;

// Build per-chapter audio: a flat URL list and a per-du'a range pointing
// into that list. Headers map to null. Most du'as get one URL from the
// global Hisnul Muslim counter; the special Al-Imran combined du'a expands
// into 11 ayat URLs from a separate source.
const audioByChapter: Record<number, { urls: string[]; duaRanges: DuaRange[] }> =
  (() => {
    const map: Record<number, { urls: string[]; duaRanges: DuaRange[] }> = {};
    let track = 0;
    for (const c of chapters) {
      const urls: string[] = [];
      const duaRanges: DuaRange[] = [];
      c.duas.forEach((d, i) => {
        if (isTopicHeader(d)) {
          duaRanges.push(null);
          return;
        }
        if (isAlimranCombinedDua(d)) {
          const start = urls.length;
          urls.push(...ALIMRAN_AYAH_URLS);
          duaRanges.push({ start, end: urls.length - 1 });
          return;
        }
        if (c.num === 15 && i === 0) {
          const start = urls.length;
          for (let k = 0; k < 5; k++) {
            track += 1;
            urls.push(audioUrl(track));
          }
          duaRanges.push({ start, end: urls.length - 1 });
          return;
        }
        track += 1;
        const start = urls.length;
        urls.push(audioUrl(track));
        duaRanges.push({ start, end: urls.length - 1 });
      });
      map[c.num] = { urls, duaRanges };
    }

    return map;
  })();

export const urlsForChapter = (num: number): string[] =>
  audioByChapter[num]?.urls ?? [];

export const rangeForDua = (chapterNum: number, duaIndex: number): DuaRange =>
  audioByChapter[chapterNum]?.duaRanges[duaIndex] ?? null;

export const urlForDua = (chapterNum: number, duaIndex: number): string | null => {
  const r = rangeForDua(chapterNum, duaIndex);
  if (!r) return null;
  return audioByChapter[chapterNum]?.urls[r.start] ?? null;
};

export const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
