#!/usr/bin/env python3
"""Export the book's content for the online edition (../arbaeen-nawawi/data.js).

Uses the same sources as the PDF, so the two editions always match.
Audio: any MP3 placed in ../arbaeen-nawawi/audio/ar/NN.mp3 or audio/en/NN.mp3
is listed here and played instead of the device's voice.
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(os.path.dirname(ROOT), "arbaeen-nawawi")
sys.path.insert(0, ROOT)
import build  # noqa: E402  (loads content, texts, figures, narrators, tests)
from build import CONTENT, PARTS, ARABIC, EXTRA, FIGURES, esc  # noqa: E402
import narrators, tests  # noqa: E402
from stories import STORIES  # noqa: E402
from figinfo import INFO  # noqa: E402
import embryo  # noqa: E402
from background import BACKGROUND  # noqa: E402
import sources  # noqa: E402


def plain_ar(n):
    t = ARABIC[n]["text"].replace("{", "").replace("}", "")
    return t.replace("ﷺ", "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ").replace("\n", " ")


def plain_en(text):
    t = re.sub(r"\[[^\]]*\]", "", text)
    t = t.replace("(ﷺ)", "(peace be upon him)").replace("ﷺ", "(peace be upon him)")
    return re.sub(r"\s+", " ", t).strip()


def steps_list(c):
    if not c.get("steps"):
        return None
    title, items = c["steps"]
    out = []
    for it in items:
        h, b = (it.split("|", 1) + [""])[:2] if "|" in it else (it, "")
        out.append([esc(h.strip()), esc(b.strip())])
    return {"title": esc(title), "items": out}


def narr(n):
    first = narrators.first_seen()
    cards = []
    for k in narrators.NARRATORS.get(n, []):
        b = narrators.BIO[k]
        cards.append({"key": k, "name": esc(b["name"]), "ar": b["ar"], "dates": b["dates"],
                      "text": esc(b["text"]) if first[k] == n else "", "see": first[k] if first[k] != n else 0})
    return {"cards": cards, "context": esc(narrators.CONTEXT.get(n, ""))}


def audio_files(lang):
    d = os.path.join(WEB, "audio", lang)
    if not os.path.isdir(d):
        return []
    return sorted(int(f[:2]) for f in os.listdir(d) if re.fullmatch(r"\d\d\.mp3", f))


def img(key):
    """Image entry for the online book, only if the file is present."""
    i = embryo.IMG[key]
    if not os.path.exists(os.path.join(WEB, i["src"])):
        return None
    return {"src": i["src"], "cap": esc(i["cap"]), "credit": esc(i["credit"]), "page": i["page"]}


SHORT = os.path.join(os.path.dirname(ROOT), "40hadith")


def redirect_page(target, title, keep_hash=False):
    js = f'"{target}"' + ('+(location.hash||"")' if keep_hash else "")
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · The Forty Hadith</title><meta name="robots" content="noindex">
<link rel="canonical" href="https://diinislaam.com{target}">
<script>location.replace({js})</script>
<meta http-equiv="refresh" content="0;url={target}">
<style>body{{font-family:Georgia,serif;background:#fbf6ea;color:#123f37;text-align:center;padding:40px 16px}}a{{color:#0f5a4f}}</style>
</head><body><p>Opening <a href="{target}">{title}</a>…</p></body></html>
"""


def short_links():
    """diinislaam.com/40hadith, /40hadith/1 … /40hadith/50 and /40hadith/test1 … test5 (printed under the QR codes)."""
    pages = {"": ("/arbaeen-nawawi/", "The Forty Hadith online", True)}
    for n in range(1, 51):
        pages[str(n)] = (f"/arbaeen-nawawi/#h/{n}", f"Hadith {n}", False)
    for k in range(1, 6):
        pages[f"test{k}"] = (f"/arbaeen-nawawi/#test/{k}", f"Review Test {k}", False)
    for sub, (target, title, keep) in pages.items():
        d = os.path.join(SHORT, sub)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(redirect_page(target, title, keep))
    return len(pages)


def main():
    hadith = []
    for n in range(1, 51):
        c = CONTENT[n]
        p = build.part_of(n)
        ar, src = build.ar_html(n)
        en, ref, url = build.english(n)
        en_body, en_tail = build.en_html(n, en)
        extra = [esc(x) for x in EXTRA[n].get("extra_en", [])] if n > 42 else []
        fig = None
        if c.get("fig"):
            key, cap = c["fig"]
            fig = {"svg": FIGURES[key], "cap": esc(cap)}
        bg_p, note_p, fns = sources.annotate(n, BACKGROUND.get(n, {}).get("paras"), c["note"])
        fm = lambda t: sources.place_marks(esc(t), lambda k: f'<sup class="fnr" data-fn="{k}">{k}</sup>')
        hadith.append({
            "n": n, "part": PARTS.index(p) + 1, "title": esc(c["title"]), "short": esc(c.get("short", c["title"])),
            "arTitle": build.ar_title(n), "theme": esc(c.get("theme", "")),
            "ar": ar, "arSrc": src, "en": en_body, "enRef": (esc(en_tail) + " · " if en_tail else "") + esc(ref), "enUrl": url,
            "extra": extra, "narr": narr(n), "note": [fm(x) for x in note_p], "fig": fig,
            "bg": ({"paras": [fm(x) for x in bg_p]} if bg_p else None),
            "fn": [[{"label": esc(r["label"]), "url": r["url"], "ar": r["ar"]} for r in map(sources.resolve, ids)] for ids in fns],
            "lessons": [esc(x) for x in c["lessons"]], "steps": steps_list(c),
            "questions": [esc(x) for x in c["questions"]], "todo": [esc(x) for x in c["todo"]],
            "sayAr": plain_ar(n), "sayEn": plain_en(en),
        })
    parts = [{"k": i + 1, "first": p[0], "last": p[1], "name": p[2].split(" · ")[1], "label": p[2].split(" · ")[0],
              "accent": p[3], "soft": p[4]} for i, p in enumerate(PARTS)]
    tdata = {}
    for k in range(1, 6):
        lefts, rights, key = tests.shuffled_match(k)
        tdata[k] = {
            "mcq": [{"q": esc(q), "o": [esc(x) for x in o], "a": a, "h": h}
                    for (q, o, a), h in zip(tests.shuffled_mcq(k), tests.MCQ_HADITH[k])],
            "match": {"left": [esc(x) for x in lefts], "right": [esc(x) for x in rights], "key": key,
                      "h": list(range(PARTS[k - 1][0], PARTS[k - 1][0] + 10))},
            "short": [{"q": esc(q), "a": esc(a)} for q, a in tests.TESTS[k]["short"]],
            "critical": [esc(q) for q in tests.TESTS[k]["critical"]],
        }
    data = {"hadith": hadith, "parts": parts, "tests": tdata,
            "audio": {"ar": audio_files("ar"), "en": audio_files("en")},
            "lantern": FIGURES["lantern"],
            "figinfo": {**{k: {"ar": v["ar"], "title": esc(v["title"]), "meaning": esc(v["meaning"]),
                               "points": [esc(x) for x in v["points"]], "verse": list(v["verse"]), "hadith": v["hadith"]} for k, v in INFO.items()},
                        **{k: {"ar": v["ar"], "title": esc(v["title"]), "meaning": esc(v["meaning"]), "points": [],
                               "sections": [[esc(h), esc(t)] for h, t in v.get("sections", [])],
                               "images": [img(i) for i in v.get("images", []) if img(i)],
                               "verse": list(v["verse"]), "hadith": v["hadith"]} for k, v in embryo.CARDS.items()}},
            "science": {"4": {"title": esc(embryo.SCIENCE["title"]),
                              "sections": [[esc(h), esc(t)] for h, t in embryo.SCIENCE["sections"]],
                              "images": [img(i) for i in embryo.SCIENCE["images"] if img(i)],
                              "videos": [{"title": esc(v["title"]), "by": esc(v["by"]), "url": v["url"]} for v in embryo.VIDEOS],
                              "sources": [[esc(l), u] for l, u in embryo.SCIENCE["sources"]]}},
            "stories": {k: {"paras": [esc(x) for x in v["paras"]], "lessons": [esc(x) for x in v["lessons"]],
                            "refs": [{"label": esc(r["label"]), "url": r["url"]} for r in map(sources.resolve, sources.STORY_REFS.get(k, []) + sources.STORY_GENERAL)]}
                        for k, v in STORIES.items()},
            "bibliography": [esc(b) for b in sources.BIBLIOGRAPHY]}
    os.makedirs(WEB, exist_ok=True)
    with open(os.path.join(WEB, "data.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by arbaeen-nawawi-book/build_web.py — do not edit by hand.\n")
        f.write("window.BOOK = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("data.js:", os.path.getsize(os.path.join(WEB, "data.js")) // 1024, "KB;",
          "audio ar", data["audio"]["ar"], "en", data["audio"]["en"])
    print("short links in /40hadith:", short_links())


if __name__ == "__main__":
    main()
