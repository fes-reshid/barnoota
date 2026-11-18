#!/usr/bin/env python3
"""Write ../zaad_app/assets/data/content.json: the planner's content for the Zaad phone app.

  python3 tools/build_app_data.py

The app reads this file, so the book and the app always carry the same names, hadith (Arabic, English, narrator, source)
and weekly Sunnahs.
"""
import importlib.util, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.join(ROOT, "src"))
spec = importlib.util.spec_from_file_location("zbuild", os.path.join(ROOT, "build.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

plain = lambda t: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()


def hadith(key, label, text, ref):
    return {"label": label, "ar": B.AR.get(B.AR_KEY.get(key, key), ""), "en": plain(text), "ref": ref, "narrator": B.NARRATOR.get(key, "")}


H = {}
for k, label, text, ref in B.EVIDENCE + B.SEASONAL:
    H[k] = hadith(k, label, text, ref)
H["afuww"] = {"label": "The dua of Laylat al-Qadr", "ar": B.AR["afuww"], "en": "O Allah, You are Pardoning and love to pardon, so pardon me.",
              "ref": "at-Tirmidhi 3513", "narrator": "'A'ishah"}
H["firstaccount"] = hadith("firstaccount", "The first thing asked about", "The first thing a servant will be called to account for on the Day of Resurrection is his prayer.", "at-Tirmidhi 413")
seasonal_titles = set(B.SEASON_WEEK_TITLES.values())
weekly = [{"title": t, "ar": B.AR.get(t, ""), "en": plain(x), "ref": r, "narrator": B.NARRATOR.get(t, ""), "action": plain(a), "seasonal": t in seasonal_titles}
          for t, x, r, a in B.WEEKLY]
data = {
    "names": [{"t": t, "a": a, "m": m, "l": B.NAME_LIVE[i]} for i, (t, a, m) in enumerate(B.NAMES)],
    "hadith": H,
    "rotation": [f[3] for f in B.FOOT if f[3] in H],       # the hadith that rotate on ordinary days
    "weekly": weekly,
    "sunnah": [{"t": t, "ref": r} for t, r, *_ in B.SUNNAH_WEEK],
    "months": [{"theme": th, "ayah": ay, "ref": rf} for th, ay, rf, *_ in B.MONTHS],
    "namesHadith": {"ar": B.AR["names99"], "en": "Allah has ninety-nine names, one hundred less one. Whoever preserves them will enter Paradise.",
                    "ref": "al-Bukhari 2736, Muslim 2677", "narrator": "Abu Hurayrah"},
}
missing = [k for k, h in H.items() if not h["ar"]]
assert not missing, f"no Arabic for {missing}"
out = os.path.join(ROOT, "..", "zaad_app", "assets", "data", "content.json")
open(out, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
print(f"{len(data['names'])} names, {len(H)} hadith, {len(data['rotation'])} rotating, {len(weekly)} weekly, {len(data['sunnah'])} Sunnahs -> {os.path.getsize(out) // 1024} KB")
