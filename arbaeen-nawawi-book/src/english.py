# -*- coding: utf-8 -*-
"""Layout of the sunnah.com English, without changing its words.

For each hadith:
  hl  - (start, end) snippets: the Prophetic / Divine words between them are coloured
  br  - snippets before which a new paragraph starts ("*" prefix = every occurrence)
  src - snippet where the reference at the end begins; it moves to the source line
"""
import re

SPEC = {
1: dict(hl=[("Actions are (judged)", "for which he migrated.")], src="[Bukhari & Muslim]"),
2: dict(hl=[("Islam is that you", "journey to it)"), ("It is that you believe", "evil aspects."),
            ("It is that you should serve", "He sees you."), ("About that the one questioned", "than the questioner."),
            ("They are that the slave-girl", "lofty buildings."), ("O `Umar, do you know", "questioner was?"),
            ("That was Jibril", "your religion.")],
        br=["The Messenger of Allah (ﷺ) replied", "We were astonished", "Then he (the man) said", "He said, \"Inform me about the Hour", "Thereupon the man went off"],
        src="[Muslim]"),
3: dict(hl=[("Islam has been built", "fasting in Ramadhan.")], src="[Bukhari & Muslim]"),
4: dict(hl=[("Verily the creation", "thus he enters it.")], br=["By the One, other than"], src="[Bukhari & Muslim]"),
5: dict(hl=[("He who innovates", "rejected (by Allah)."), ("He who does an act", "rejected (by Allah).")], br=["In another version"]),
6: dict(hl=[("That which is lawful", "it is the heart.")], br=["Truly in the body"], src="[Bukhari & Muslim]"),
7: dict(hl=[("The deen (religion)", "sincerity)."), ("To Allah, His Book", "common folk.")], src="[Muslim]"),
8: dict(hl=[("I have been ordered", "will be with Allah.")], src="[Bukhari & Muslim]"),
9: dict(hl=[("What I have forbidden", "who were before you.")], src="[Bukhari & Muslim]"),
10: dict(hl=[("Allah the Almighty is Good", "[2:172]"), ("a man who, having journeyed far", "be answered?")],
         br=["Then he (ﷺ) mentioned"], src="[Muslim]"),
11: dict(hl=[("Leave that which makes you doubt", "does not make you doubt.")], src="[At-Tirmidhi]"),
12: dict(hl=[("Part of the perfection", "does not concern him.")], src="A hasan (good) hadeeth"),
13: dict(hl=[("None of you [truly] believes", "for himself.")], src="[Al-Bukhari]"),
14: dict(hl=[("It is not permissible", "from the community.")], src="[Al-Bukhari]"),
15: dict(hl=[("Let him who believes", "generous to his guest.")], src="[Al-Bukhari]"),
16: dict(hl=[("Do not become angry", "angry"), ("Do not become angry", "angry")], src="[Al-Bukhari]"),
17: dict(hl=[("Verily Allah has prescribed", "animal he slaughters.")], src="[Muslim]"),
18: dict(hl=[("Have taqwa", "towards the people.")], src="It was related by at-Tirmidhi"),
19: dict(hl=[("O young man", "pages have dried."), ("Be mindful of Allah, and you will find", "hardship with ease")],
         br=["It was related by at-Tirmidhi", "Another narration"]),
20: dict(hl=[("Verily, from what was learnt", "do as you wish.")], src="[Al-Bukhari]"),
21: dict(hl=[("Say I believe in Allah", "be steadfast.")], src="[Muslim]"),
22: dict(hl=[("Yes.", "Yes.")], src="[Muslim]"),
23: dict(hl=[("Purity is half", "causing its ruin.")], src="[Muslim]"),
24: dict(hl=[("O My servants! I have forbidden", "no one but himself.")], br=["*O My servants,"], src="[Muslim]"),
25: dict(hl=[("Has not Allah made", "there is a charity."), ("Do you not see", "deserving of a reward.")],
         br=["They said,"], src="[Muslim]"),
26: dict(hl=[("Every joint", "from the road is a charity.")], src="[Al-Bukhari]"),
27: dict(hl=[("Righteousness is in good character", "finding out about."), ("You have come to ask", "righteousness."),
             ("Consult your heart", "[in its favour].")],
         br=["And on the authority of Wabisah"], src="A good hadeeth transmitted"),
28: dict(hl=[("I counsel you", "is misguidance.")], br=["He (ﷺ) said, “I counsel"], src="[Abu Dawud]"),
29: dict(hl=[("You have asked me about a great matter", "pilgrimage to the House."), ("Shall I not guide you", "depths of the night."),
             ("Shall I not inform you of the head", "its peak?"), ("The head of the matter", "peak is jihad."),
             ("Shall I not tell you of the foundation", "of all of that?"), ("Restrain this.", "Restrain this."),
             ("May your mother", "of their tongues?")],
         br=["Then he (ﷺ) said, “Shall I not guide", "Then he (ﷺ) recited", "Then he (ﷺ) said, “Shall I not inform",
             "Then he (ﷺ) said, “Shall I not tell", "So he took hold"],
         src="It was related by at-Tirmidhi"),
30: dict(hl=[("Verily Allah ta’ala has laid down", "do not seek after them.")], src="A hasan hadeeth narrated"),
31: dict(hl=[("Renounce the world", "people will love you.")], src="A hasan hadeeth related"),
32: dict(hl=[("There should be neither", "(dirar).")], src="A hasan hadeeth related"),
33: dict(hl=[("Were people to be given", "him who denies.")], src="A hasan hadeeth narrated"),
34: dict(hl=[("Whosoever of you sees an evil", "weakest of faith.")], src="[Muslim]"),
35: dict(hl=[("Do not envy one another", "is right here"), ("It is evil enough", "and his honour.")], src="[Muslim]"),
36: dict(hl=[("Whoever removes a worldly grief", "forward by his lineage.")], br=["No people gather together"], src="Related by [Muslim]"),
37: dict(hl=[("Verily Allah ta’ala has written", "as one evil deed.")], src="[Al-Bukhari]"),
38: dict(hl=[("Verily Allah ta’ala has said", "grant him refuge.")], src="[Al-Bukhari]"),
39: dict(hl=[("Verily Allah has pardoned", "under duress.")], src="A hasan hadeeth related"),
40: dict(hl=[("Be in this world", "a wayfarer.")], br=["And Ibn Umar"], src="[Al-Bukhari]"),
41: dict(hl=[("None of you [truly] believes", "which I have brought.")], src="[Imam an-Nawawi says:]"),
42: dict(hl=[("Allah the Almighty has said", "as great as it [too].")], br=["*O Son of Adam, were"], src="It was related by at-Tirmidhi"),
43: dict(hl=[("Give the Fara'id", "of the deceased.")]),
44: dict(hl=[("I think he is so and so", "by reason of fosterage)."), ("Yes. Fosterage", "consanguinity makes unlawful.")],
         br=["'A'isha said: Messenger of Allah"]),
45: dict(hl=[("Allah and His Apostle made illegal", "pigs and idols."), ("No, it is illegal", "illegal."), ("May Allah curse the Jews", "ate its price.")],
         br=["The people asked", "Allah's Messenger (ﷺ) further said"]),
46: dict(hl=[("What are they?", "they?"), ("All intoxicants are prohibited", "prohibited.")]),
47: dict(hl=[("The human does not fill", "for his breath.")]),
48: dict(hl=[("There are four characteristics", "obscene speech.")]),
49: dict(hl=[("If you were to rely", "returns full.")]),
50: dict(hl=[("Let not your tongue", "remembrance of Allah.")]),
}

PB = "¶"  # paragraph marker
REF = re.compile(r"\[(?:Bukhari & Muslim|Muslim|Al-Bukhari|At-Tirmidhi|An-Nasai|Abu Dawud)\]")


def layout(n, text):
    """Return (marked_text, source_tail). Marked text uses {…} for highlights and ¶ for paragraph breaks."""
    sp = SPEC.get(n, {})
    text = text.replace(" (ﷺ)", " ﷺ").replace("(ﷺ)", "ﷺ")
    snip = lambda s: s.replace(" (ﷺ)", " ﷺ").replace("(ﷺ)", "ﷺ")
    tail = ""
    if sp.get("src"):
        i = text.rfind(snip(sp["src"]))
        assert i > 0, (n, "src", sp["src"])
        text, tail = text[:i].rstrip(), text[i:].strip()
    # highlight ranges
    spans, cur = [], 0
    for a, b in sp.get("hl", []):
        a, b = snip(a), snip(b)
        s = text.find(a, cur)
        assert s >= 0, (n, "hl-start", a)
        e = text.find(b, s)
        assert e >= 0, (n, "hl-end", b)
        e += len(b)
        spans.append((s, e))
        cur = e
    # paragraph breaks
    breaks = set()
    for b in sp.get("br", []):
        allocc = b.startswith("*")
        b = snip(b.lstrip("*"))
        pos = text.find(b)
        assert pos >= 0, (n, "br", b)
        while pos >= 0:
            breaks.add(pos)
            if not allocc:
                break
            pos = text.find(b, pos + 1)
    out = []
    for i, ch in enumerate(text):
        if i in breaks and i > 0:
            out.append(PB)
        if any(s == i for s, _ in spans):
            out.append("{")
        out.append(ch)
        if any(e == i + 1 for _, e in spans):
            out.append("}")
    return "".join(out), tail
