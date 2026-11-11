# -*- coding: utf-8 -*-
"""Footnotes and references.

A reference id is one of:
  "bukhari:4514", "muslim:8a", "tirmidhi:2616", "abudawud:1721", "nasai:5017", "ibnmajah:277"  -> sunnah.com
  "q:2:286" or "q:2:67-71"                                                                        -> Qur'an (quran.com)
  a key of BOOKS                                                                                  -> a book or report without a link
All hadith numbers were checked against the sunnah.com data (fawazahmed0/hadith-api mirror).

Footnotes are placed in three ways:
  - background paragraphs carry inline tokens [[id;id]]
  - explanatory notes: NOTE_REFS[n] = [(snippet, [ids]), ...]; the footnote goes right after the snippet
  - Companion stories (online): STORY_REFS[key] = [ids]
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

COLL = {
    "bukhari": "Ṣaḥīḥ al-Bukhārī", "muslim": "Ṣaḥīḥ Muslim", "tirmidhi": "Jāmiʿ at-Tirmidhī",
    "abudawud": "Sunan Abī Dāwūd", "nasai": "Sunan an-Nasā’ī", "ibnmajah": "Sunan Ibn Mājah",
}
SURAH = {2: "al-Baqarah", 3: "Āl ʿImrān", 4: "an-Nisā’", 5: "al-Mā’idah", 9: "at-Tawbah", 10: "Yūnus", 11: "Hūd",
         13: "ar-Raʿd", 16: "an-Naḥl", 19: "Maryam", 20: "Ṭā-Hā", 32: "as-Sajdah", 39: "az-Zumar", 41: "Fuṣṣilat",
         49: "al-Ḥujurāt", 57: "al-Ḥadīd", 65: "aṭ-Ṭalāq"}

BOOKS = {
    "jami": "Ibn Rajab, Jāmiʿ al-ʿUlūm wa-l-Ḥikam, commentary on this hadith.",
    "fath": "Ibn Ḥajar, Fatḥ al-Bārī (commentary on Ṣaḥīḥ al-Bukhārī), on this hadith.",
    "ummqays": "aṭ-Ṭabarānī, al-Muʿjam al-Kabīr, from Ibn Masʿūd. Ibn Ḥajar said in Fatḥ al-Bārī that its chain is authentic by the standards of al-Bukhārī and Muslim.",
    "rajab_ummqays": "Ibn Rajab, Jāmiʿ al-ʿUlūm wa-l-Ḥikam, Hadith 1.",
    "madarij": "Ibn al-Qayyim, Madārij as-Sālikīn, quoting Ibn Taymiyyah’s definition of zuhd.",
    "shuab": "al-Bayhaqī, Shuʿab al-Īmān, from ʿĀ’ishah; graded ḥasan by al-Albānī (as-Silsilah aṣ-Ṣaḥīḥah 1113).",
    "ahmad_silence": "Musnad Aḥmad, from Ibn ʿAbbās: “If one of you becomes angry, let him be silent.”",
    "ahmad_wabisah": "Musnad Aḥmad and Sunan ad-Dārimī, the hadith of Wābiṣah ibn Maʿbad.",
    "ahmad_ibnabbas": "Musnad Aḥmad, the longer narration of Ibn ʿAbbās (“…Know Allah in ease…”).",
    "hasan_nifaq": "Reported by al-Bukhārī without a chain in the Book of Faith (chapter: the believer’s fear that his deeds may be lost), and with a chain by al-Firyābī.",
    "sirah": "Ibn Hishām, as-Sīrah an-Nabawiyyah.",
    "isabah": "Ibn Ḥajar, al-Iṣābah fī Tamyīz aṣ-Ṣaḥābah.",
    "siyar": "adh-Dhahabī, Siyar Aʿlām an-Nubalā’.",
    "ibnsad": "Ibn Saʿd, aṭ-Ṭabaqāt al-Kubrā.",
    "hilyah": "Abū Nuʿaym, Ḥilyat al-Awliyā’.",
    "ahmad_milk": "Musnad Aḥmad, from Ibn Masʿūd (the story of the ewe’s milk, and of his thin legs).",
    "hakim_marwan": "al-Ḥākim, al-Mustadrak (Marwān’s test of Abū Hurayrah’s memory); also in Siyar Aʿlām an-Nubalā’.",
    "ibnbusr_century": "Recorded in al-Bukhārī’s at-Tārīkh al-Kabīr and by Ibn Saʿd (“This boy will live a century”).",
}

# Arabic originals shown with some references (background narrations).
DIAC = "[ً-ْٰ]*"
SAW = re.compile("ص" + DIAC + "ل" + DIAC + "ى" + DIAC + r"\s+" + "ا" + DIAC + "ل" + DIAC + "ل" + DIAC + "ه" + DIAC + r"\s+"
                 + "ع" + DIAC + "ل" + DIAC + "ي" + DIAC + "ه" + DIAC + r"\s+" + "و" + DIAC + "س" + DIAC + "ل" + DIAC + "م" + DIAC)
AR = {k: SAW.sub("ﷺ", v) for k, v in json.load(open(os.path.join(HERE, "..", "data", "background-arabic.json"), encoding="utf-8")).items()}
AR["muslim:8a"] += " …"
AR["ummqays"] = "عَنْ عَبْدِ اللَّهِ بْنِ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: كَانَ فِينَا رَجُلٌ خَطَبَ امْرَأَةً يُقَالُ لَهَا أُمُّ قَيْسٍ، فَأَبَتْ أَنْ تَتَزَوَّجَهُ حَتَّى يُهَاجِرَ، فَهَاجَرَ فَتَزَوَّجَهَا، قَالَ: فَكُنَّا نُسَمِّيهِ مُهَاجِرَ أُمِّ قَيْسٍ."
AR["rajab_ummqays"] = "قَالَ ابْنُ رَجَبٍ: «وَقَدِ اشْتَهَرَ أَنَّ قِصَّةَ مُهَاجِرِ أُمِّ قَيْسٍ هِيَ كَانَتْ سَبَبَ قَوْلِ النَّبِيِّ ﷺ: مَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا، وَذَكَرَ ذَلِكَ كَثِيرٌ مِنَ المُتَأَخِّرِينَ فِي كُتُبِهِمْ، وَلَمْ نَرَ لِذَلِكَ أَصْلًا بِإِسْنَادٍ يَصِحُّ»."


def resolve(rid):
    """-> dict(label, url, ar)"""
    if rid in BOOKS:
        return {"label": BOOKS[rid], "url": "", "ar": AR.get(rid, "")}
    if rid.startswith("q:"):
        _, s, v = rid.split(":")
        return {"label": f"Qur’an, {SURAH.get(int(s), 'Sūrah ' + s)} {s}:{v}", "url": f"https://quran.com/{s}/{v}", "ar": ""}
    coll, num = rid.split(":")
    return {"label": f"{COLL[coll]} {num}", "url": f"https://sunnah.com/{coll}:{num}", "ar": AR.get(rid, "")}


def label(ids):
    t = "; ".join(resolve(i)["label"].rstrip(".") for i in ids)
    return t if t.endswith(("”", ".")) else t + "."


# ---------------------------------------------------------------- explanatory notes
NOTE_REFS = {
1: [("it is one third of knowledge", ["jami"])],
3: [("between a man and disbelief is abandoning the prayer", ["muslim:82a"])],
4: [("towards what he was created for.”", ["bukhari:4949", "muslim:2647a"]),
    ("*as it appears to the people*.”", ["bukhari:2898", "muslim:112a"])],
5: [("(al-Mā’idah 5:3)", ["q:5:3"]),
    ("conditions that are not in the Book of Allah", ["bukhari:2155", "muslim:1504a"])],
8: [("(al-Baqarah 2:256)", ["q:2:256"]),
    ("Abū Bakr used this hadith", ["bukhari:1399", "muslim:20"])],
9: [("(al-Baqarah 2:286)", ["q:2:286"]), ("(al-Baqarah 2:67-71)", ["q:2:67-71"])],
11: [("“For truthfulness is tranquillity, and lying is doubt.”", ["tirmidhi:2518"])],
13: [("“…the *good* that he loves for himself.”", ["nasai:5017"])],
14: [("(al-Mā’idah 5:32)", ["q:5:32"]), ("(al-Baqarah 2:178)", ["q:2:178"])],
15: [("he thought the neighbour would be made an heir", ["bukhari:6014"]),
     ("hospitality is up to three days", ["bukhari:6019"])],
16: [("controls himself when angry.”", ["bukhari:6114", "muslim:2609a"]),
     ("seeking refuge with Allah from Shayṭān", ["bukhari:3282"]),
     ("staying silent", ["ahmad_silence"]),
     ("changing position", ["abudawud:4782"]),
     ("(Āl ʿImrān 3:134)", ["q:3:134"])],
17: [("a woman entered the Fire because of a cat she starved", ["bukhari:3482"]),
     ("giving water to a thirsty dog", ["bukhari:2363"]),
     ("when one of you does a job, he perfects it.”", ["shuab"])],
18: [("(Hūd 11:114)", ["q:11:114"]),
     ("nothing is heavier on the scale than good character", ["tirmidhi:2002"]),
     ("the best of people are the best in character", ["bukhari:3559"])],
19: [("The longer narration adds", ["ahmad_ibnabbas"])],
20: [("“Modesty is a branch of faith”", ["bukhari:9", "muslim:35a"]),
     ("“Modesty brings nothing but good.”", ["bukhari:6117", "muslim:37a"]),
     ("did not prevent them from learning their religion", ["muslim:332a"])],
21: [("(Fuṣṣilat 41:30)", ["q:41:30"]), ("(Hūd 11:112)", ["q:11:112"]),
     ("though you will not be able to do it fully”", ["ibnmajah:277"]),
     ("“Aim for what is right and come close.”", ["bukhari:6463"])],
24: [("the noblest hadith of the people of Shām", ["jami"])],
25: [("He gives it to whom He wills.”", ["muslim:595a"])],
26: [("created with **360 joints**", ["muslim:1007a"]),
     ("praying two rakʿahs of Ḍuḥā is enough for all 360", ["muslim:720"])],
30: [("(Maryam 19:64)", ["q:19:64"])],
31: [("Ibn Taymiyyah defined it", ["madarij"]), ("(al-Ḥadīd 57:23)", ["q:57:23"])],
32: [("(al-Baqarah 2:231)", ["q:2:231"]), ("(an-Nisā’ 4:12)", ["q:4:12"])],
33: [("warned leads to the Fire", ["muslim:137a"])],
34: [("“Gentleness is not in anything except that it beautifies it.”", ["muslim:2594a"])],
35: [("in his farewell sermon", ["bukhari:67", "muslim:1679a"])],
37: [("‘Woe to the one whose ones overcome his tens.’", ["jami"])],
38: [("(Yūnus 10:62-63)", ["q:10:62-63"])],
39: [("make a mistake” (2:286)", ["q:2:286"]), ("(an-Nisā’ 4:92)", ["q:4:92"]), ("(an-Naḥl 16:106)", ["q:16:106"])],
41: [("(an-Nisā’ 4:65)", ["q:4:65"]), ("his child and all people.”", ["bukhari:15", "muslim:44a"])],
42: [("(an-Nisā’ 4:48)", ["q:4:48"]), ("(az-Zumar 39:53)", ["q:39:53"])],
43: [("(an-Nisā’ 4:11, 12, 176)", ["q:4:11-12", "q:4:176"])],
44: [("based on a narration of ʿĀ’ishah in Muslim", ["muslim:1452a"]), ("(al-Baqarah 2:233)", ["q:2:233"])],
46: [("(Abū Dāwūd, at-Tirmidhī)", ["abudawud:3681", "tirmidhi:1865"]),
     ("(al-Mā’idah 5:90-91)", ["q:5:90-91"]),
     ("cursed ten people involved with wine", ["tirmidhi:1295"])],
47: [("a foundation for all of medicine", ["jami"])],
48: [("(an-Nisā’ 4:145)", ["q:4:145"]), ("only a hypocrite feels safe from it.’", ["hasan_nifaq"])],
49: [("“Tie it and rely on Allah.”", ["tirmidhi:2517"]), ("Imam Aḥmad said", ["jami"]), ("(aṭ-Ṭalāq 65:3)", ["q:65:3"])],
50: [("like the living and the dead", ["bukhari:6407"]), ("(Āl ʿImrān 3:191)", ["q:3:191"]), ("(ar-Raʿd 13:28)", ["q:13:28"])],
}

# ---------------------------------------------------------------- Companion life stories (online)
STORY_REFS = {
"umar": ["tirmidhi:3681", "sirah", "tirmidhi:3686", "bukhari:3683", "bukhari:3700"],
"ibnumar": ["bukhari:2664", "bukhari:1122"],
"ibnmasud": ["ahmad_milk", "sirah", "bukhari:5050", "ibnmajah:138"],
"aishah": ["bukhari:3662", "bukhari:3775", "tirmidhi:3883", "muslim:746a"],
"numan": ["bukhari:2587"],
"tamim": ["muslim:2942a", "hilyah"],
"abuhurayrah": ["bukhari:2047", "bukhari:6452", "bukhari:119", "hakim_marwan", "muslim:2491"],
"hasan": ["bukhari:3749", "tirmidhi:3774", "nasai:1141", "bukhari:2704"],
"anas": ["bukhari:6038", "muslim:2310a", "bukhari:1982", "muslim:2481b"],
"shaddad": ["hilyah"],
"abudharr": ["bukhari:3522", "muslim:2473a", "tirmidhi:3801", "sirah"],
"muadh": ["bukhari:5003", "tirmidhi:3791", "abudawud:1522", "abudawud:3592"],
"ibnabbas": ["bukhari:143", "bukhari:75", "bukhari:4970"],
"abumasud": ["muslim:1659a"],
"sufyan": ["muslim:38", "tirmidhi:2410"],
"jabir": ["tirmidhi:3010", "bukhari:4052", "bukhari:2601", "bukhari:4101"],
"abumalik": ["bukhari:4388", "bukhari:2486"],
"nawwas": ["muslim:2553b", "muslim:2937a"],
"wabisah": ["ahmad_wabisah"],
"irbad": ["q:9:92"],
"abuthalabah": ["ibnsad"],
"sahl": ["bukhari:5030", "bukhari:1896"],
"abusaid": ["bukhari:1469", "muslim:49a"],
"abdullahibnamr": ["bukhari:113", "abudawud:3646", "bukhari:1975", "bukhari:5052"],
"abumusa": ["bukhari:3136", "bukhari:5048", "bukhari:3038"],
"miqdam": ["bukhari:2072", "abudawud:5124"],
"ibnbusr": ["muslim:2042a", "ibnbusr_century"],
}
STORY_GENERAL = ["isabah", "siyar"]

BIBLIOGRAPHY = [
    "Ibn Rajab al-Ḥanbalī, Jāmiʿ al-ʿUlūm wa-l-Ḥikam fī Sharḥ Khamsīna Ḥadīthan min Jawāmiʿ al-Kalim.",
    "an-Nawawī, Sharḥ al-Arbaʿīn an-Nawawiyyah; and al-Minhāj Sharḥ Ṣaḥīḥ Muslim.",
    "Ibn Daqīq al-ʿĪd, Sharḥ al-Arbaʿīn an-Nawawiyyah.",
    "Muḥammad ibn Ṣāliḥ al-ʿUthaymīn, Sharḥ al-Arbaʿīn an-Nawawiyyah.",
    "Ibn Ḥajar al-ʿAsqalānī, Fatḥ al-Bārī bi-Sharḥ Ṣaḥīḥ al-Bukhārī; and al-Iṣābah fī Tamyīz aṣ-Ṣaḥābah.",
    "adh-Dhahabī, Siyar Aʿlām an-Nubalā’.",
    "Ibn Hishām, as-Sīrah an-Nabawiyyah; Ibn Saʿd, aṭ-Ṭabaqāt al-Kubrā.",
    "The hadith collections: Ṣaḥīḥ al-Bukhārī, Ṣaḥīḥ Muslim, Sunan Abī Dāwūd, Jāmiʿ at-Tirmidhī, Sunan an-Nasā’ī, Sunan Ibn Mājah, Musnad Aḥmad.",
    "English translations of the hadith: sunnah.com. Qur’an references: quran.com.",
]

TOKEN = re.compile(r"\[\[([^\]]+)\]\]")
MARK = "⟦{}⟧"  # ⟦n⟧ placeholder for a footnote number, replaced after escaping


def annotate(n, bg_paras, note_paras):
    """Insert footnote placeholders. Returns (bg_paras, note_paras, footnotes) where footnotes = [[ids], ...] numbered from 1."""
    notes = []

    def add(ids):
        notes.append(ids)
        return MARK.format(len(notes))

    bg = [TOKEN.sub(lambda m: add([x.strip() for x in m.group(1).split(";")]), p) for p in (bg_paras or [])]
    out = list(note_paras)
    for snippet, ids in NOTE_REFS.get(n, []):
        for i, p in enumerate(out):
            if snippet in p:
                k = p.index(snippet) + len(snippet)
                out[i] = p[:k] + add(ids) + p[k:]
                break
        else:
            raise AssertionError(f"Hadith {n}: footnote anchor not found: {snippet!r}")
    # renumber in reading order (background first, then the note)
    order = []
    for p in bg + out:
        order += [int(x) for x in re.findall("\u27e6(\\d+)\u27e7", p)]
    remap = {old: new for new, old in enumerate(order, 1)}
    fix = lambda p: re.sub("\u27e6(\\d+)\u27e7", lambda m: MARK.format(remap[int(m.group(1))]), p)
    return [fix(p) for p in bg], [fix(p) for p in out], [notes[old - 1] for old in order]


def place_marks(html_text, render):
    """Replace ⟦n⟧ placeholders (already escaped text) using render(n) -> html."""
    return re.sub("⟦(\\d+)⟧", lambda m: render(int(m.group(1))), html_text)
