#!/usr/bin/env python3
"""Check each Sunnah of the week against the source collections.

  python3 tools/check_sunnah.py /path/to/editions     (the hadith-api folder used by fetch_arabic.py)

al-Bukhari, at-Tirmidhi and Abu Dawud are checked by hadith number. Sahih Muslim in the source files uses a different
numbering from the one printed in the planner, so each Muslim item is only checked to exist in Sahih Muslim by its words.
"""
import json, os, re, sys

SRC = sys.argv[1]
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))
from content import SUNNAH_WEEK  # noqa: E402

cache = {}


def book(b):
    if b not in cache:
        cache[b] = {h["hadithnumber"]: h["text"] for h in json.load(open(os.path.join(SRC, f"eng-{b}.json"), encoding="utf-8"))["hadiths"]}
    return cache[b]


bad = 0
for i, (text, ref, b, n, pat) in enumerate(SUNNAH_WEEK, 1):
    rx = re.compile(pat, re.I)
    if n:
        t = book(b).get(n, "")
        ok = bool(rx.search(t))
        shown = t[:110].replace("\n", " ")
    else:
        hits = [k for k, t in book(b).items() if rx.search(t)]
        ok, shown = bool(hits), f"{len(hits)} matching hadith in Sahih Muslim (number not checked)"
    if not ok:
        bad += 1
    print(f"{'ok ' if ok else 'BAD'} {i:2} {ref[:34]:34} {shown}")
print(f"\n{len(SUNNAH_WEEK) - bad} of {len(SUNNAH_WEEK)} found")
