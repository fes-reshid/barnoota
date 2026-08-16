import rawData from "./hisnul.json";

export type DuaPair = { arabic: string; oromo: string };
export type Chapter = {
  num: number;
  arabicTitle: string;
  oromoTitle: string;
  duas: DuaPair[];
};

// A du'a entry that is actually the title of an embedded sub-chapter
// (e.g. "2 ــ دعاء لبس الثوب" / "Du'aa'ii huccuu uffachuu") rather than a
// quoted du'a body. Detect by absence of opening quote/paren in the Arabic
// and a leading numeric+dash pattern.
function isEmbeddedHeader(d: DuaPair) {
  const a = (d.arabic || "").trimStart();
  if (!a) return false;
  if (a.startsWith("(") || a.startsWith("«") || a.startsWith("\"")) return false;
  return /\d+\s*[ـ\-]+/.test(a);
}

function cleanArabicTitle(s: string) {
  return s.replace(/^\s*\d+\.?\s*\d*\s*[ـ\-]+\s*/, "").trim();
}

function splitEmbeddedChapters(input: Chapter[]): Chapter[] {
  const out: Chapter[] = [];
  const queue: Chapter[] = [...input];
  while (queue.length) {
    const ch = queue.shift()!;
    const duas = ch.duas || [];
    const headerIdx = duas.findIndex(isEmbeddedHeader);
    if (headerIdx === -1) {
      out.push(ch);
      continue;
    }
    const before = duas.slice(0, headerIdx);
    const header = duas[headerIdx];
    const after = duas.slice(headerIdx + 1);
    out.push({ ...ch, duas: before });
    // Re-enqueue the remainder so any further embedded headers also split.
    queue.unshift({
      num: ch.num,
      arabicTitle: cleanArabicTitle(header.arabic),
      oromoTitle: header.oromo.trim(),
      duas: after,
    });
  }
  // sequential renumber so the visible list reads 1, 2, 3...
  return out.map((c, i) => ({ ...c, num: i + 1 }));
}

const processed = splitEmbeddedChapters(rawData as Chapter[])
  .filter((c) => c.duas && c.duas.length > 0)
  .map((c, i) => ({ ...c, num: i + 1 }));

export const chapters: Chapter[] = processed;

export const chapterById = (id: number) => chapters.find((c) => c.num === id);

// Curated "featured" categories surfaced on the home screen
export const featuredNums = [27, 28, 1, 25, 34, 35, 50, 70];

export function getFeatured() {
  return featuredNums
    .map((n) => chapters.find((c) => c.num === n))
    .filter((c): c is Chapter => Boolean(c));
}

export function searchChapters(query: string): Chapter[] {
  const q = query.trim().toLowerCase();
  if (!q) return chapters;
  return chapters.filter((c) => {
    if (c.oromoTitle.toLowerCase().includes(q)) return true;
    if (c.arabicTitle.includes(query)) return true;
    if (String(c.num) === q) return true;
    return c.duas.some(
      (d) =>
        d.oromo.toLowerCase().includes(q) || d.arabic.includes(query),
    );
  });
}
