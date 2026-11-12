#!/usr/bin/env python3
"""Pull the Arabic text of each hadith in the planner from the hadith-api editions and write src/arabic.json.

The editions are the JSON files of github.com/fawazahmed0/hadith-api (editions/ara-<book>.min.json), downloaded
into a folder given as the first argument. Each hadith is found by its opening (and closing) words, so the
hadith numbers printed in the planner are checked against the source at the same time.

  python3 tools/fetch_arabic.py /path/to/editions
"""
import json, os, re, sys, unicodedata

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "arabic.json")
SAW = "صلى الله عليه وسلم"
MAP = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ؤ": "و", "ئ": "ي", "ة": "ه"}


def norm_map(s):
    """Normalised text (letters only, single spaces) and, for each character of it, its index in s."""
    out, idx = [], []
    for i, c in enumerate(s):
        if unicodedata.combining(c) or c in "ـء":
            continue
        c = MAP.get(c, c)
        if "ء" <= c <= "ي":
            out.append(c); idx.append(i)
        elif out and out[-1] != " ":
            out.append(" "); idx.append(i)
    return "".join(out), idx


def norm(s):
    return norm_map(s)[0].strip()


def clean(s):
    s = s.replace("‏", "").replace('"', " ").replace("‎", "")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s+([،.؛:])", r"\1", s)
    return s.strip(" .،؛:-")


# (key, book, cited number or None, opening words, closing words or None, "last" to use the last occurrence of the closing words)
SPECS = [
    # --- the hadith behind every tick ---
    ("ontime", "bukhari", 527, "أي العمل أحب إلى الله", "الصلاة على وقتها"),
    ("jamaah", "bukhari", 645, "صلاة الجماعة تفضل صلاة الفذ", "وعشرين درجة"),
    ("rawatib", "muslim", None, "من صلى اثنتي عشرة ركعة في يوم وليلة", "بيت في الجنة"),
    ("fajr2", "muslim", None, "ركعتا الفجر خير من الدنيا وما فيها", None),
    ("tasbih", "muslim", None, "من سبح الله في دبر كل صلاة ثلاثا وثلاثين", "مثل زبد البحر"),
    ("adhkar", "muslim", None, "من قال حين يصبح وحين يمسي سبحان الله وبحمده", "أو زاد عليه"),
    ("quran", "muslim", None, "اقرءوا القرآن فإنه يأتي يوم القيامة", "شفيعا لأصحابه"),
    ("duha", "bukhari", 1981, "أوصاني خليلي", "قبل أن أنام"),
    ("witr", "bukhari", 998, "اجعلوا آخر صلاتكم بالليل وترا", None),
    ("qiyam", "muslim", None, "وأفضل الصلاة بعد الفريضة", "صلاة الليل"),
    ("istighfar", "bukhari", 6307, "والله إني لأستغفر الله", "سبعين مرة"),
    ("salawat", "muslim", None, "من صلى علي واحدة", "عشرا"),
    ("sadaqah", "bukhari", 6023, "اتقوا النار ولو بشق تمرة", "فبكلمة طيبة"),
    ("kin", "bukhari", 5986, "من أحب أن يبسط له في رزقه", "فليصل رحمه"),
    ("tongue", "bukhari", 6018, "من كان يؤمن بالله واليوم الآخر فليقل خيرا أو ليصمت", None),
    ("siwak", "bukhari", 887, "لولا أن أشق على أمتي", "مع كل صلاة"),
    ("sleep", "bukhari", 247, "إذا أتيت مضجعك فتوضأ وضوءك للصلاة", "على شقك الأيمن"),
    ("kursi", "bukhari", 2311, "إذا أويت إلى فراشك فاقرأ آية الكرسي", "حتى تصبح"),
    ("baqarah", "bukhari", 5009, "من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه", None),
    ("constant", "bukhari", 6464, "أحب الأعمال أدومها إلى الله", "وإن قل"),
    ("smile", "muslim", None, "لا تحقرن من المعروف شيئا", "بوجه طلق"),
    ("shukr", "muslim", None, "عجبا لأمر المؤمن", "صبر فكان خيرا له"),
    # --- Friday, the week, the seasons ---
    ("jumuah", "bukhari", 883, "لا يغتسل رجل يوم الجمعة", "الجمعة الأخرى"),
    ("hour", "bukhari", 935, "فيه ساعة لا يوافقها عبد مسلم", "إلا أعطاه إياه"),
    ("monthu", "tirmidhi", 747, "تعرض الأعمال يوم الاثنين والخميس", "وأنا صائم"),
    ("white", "tirmidhi", 761, "يا أبا ذر إذا صمت من الشهر ثلاثة أيام", "وخمس عشرة"),
    ("ramadan", "bukhari", 38, "من صام رمضان إيمانا واحتسابا", "ما تقدم من ذنبه"),
    ("taraweeh", "bukhari", 37, "من قام رمضان إيمانا واحتسابا", "ما تقدم من ذنبه"),
    ("suhoor", "bukhari", 1923, "تسحروا فإن في السحور بركة", None),
    ("iftar", "bukhari", 1957, "لا يزال الناس بخير ما عجلوا الفطر", None),
    ("qadr", "bukhari", 2017, "تحروا ليلة القدر في الوتر من العشر الأواخر من رمضان", None),
    ("shawwal", "muslim", None, "من صام رمضان ثم أتبعه ستا من شوال", "كصيام الدهر"),
    ("tendays", "abudawud", 2438, "ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام", None),
    ("arafah", "muslim", None, "صيام يوم عرفة أحتسب على الله", "السنة التي بعده"),
    ("ashura", "muslim", None, "وصيام يوم عاشوراء أحتسب على الله", "السنة التي قبله"),
    ("tashriq", "muslim", None, "أيام التشريق أيام أكل وشرب", None),
    # --- hadith of the week ---
    ("Begin with the intention", "bukhari", 1, "إنما الأعمال بالنيات", "ما نوى"),
    ("The five pillars", "bukhari", 8, "بني الإسلام على خمس", "وصوم رمضان"),
    ("Leave what does not concern you", "tirmidhi", 2317, "من حسن إسلام المرء تركه ما لا يعنيه", None),
    ("Love for your brother", "bukhari", 13, "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه", None),
    ("Do not become angry", "bukhari", 6116, "أن رجلا قال للنبي", "لا تغضب", "last"),
    ("The gates are opened", "muslim", None, "إذا جاء رمضان فتحت أبواب الجنة", "وصفدت الشياطين"),
    ("Fasting is for Allah", "bukhari", 1904, "كل عمل ابن آدم له إلا الصيام", "والصيام جنة"),
    ("More than hunger", "bukhari", 1903, "من لم يدع قول الزور والعمل به", "طعامه وشرابه"),
    ("The most generous of people", "bukhari", 6, "كان رسول الله أجود الناس", "فيدارسه القرآن"),
    ("Seek the Night of Decree", "bukhari", 1901, "من قام ليلة القدر إيمانا واحتسابا", "ما تقدم من ذنبه"),
    ("Taqwa wherever you are", "tirmidhi", 1987, "اتق الله حيثما كنت", "بخلق حسن"),
    ("Be mindful of Allah", "tirmidhi", 2516, "احفظ الله يحفظك", "فاستعن بالله"),
    ("Leave what makes you doubt", "tirmidhi", 2518, "دع ما يريبك", "إلى ما لا يريبك"),
    ("Purity is half of faith", "muslim", None, "الطهور شطر الإيمان", "حجة لك أو عليك"),
    ("A traveller in this world", "bukhari", 6416, "كن في الدنيا كأنك غريب أو عابر سبيل", None),
    ("Excellence in everything", "muslim", None, "إن الله كتب الإحسان", "على كل شيء"),
    ("The strong believer", "muslim", None, "المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف", "ولا تعجز"),
    ("Two blessings", "bukhari", 6412, "نعمتان مغبون فيهما كثير من الناس", "والفراغ"),
    ("True strength", "bukhari", 6114, "ليس الشديد بالصرعة", "عند الغضب"),
    ("Safe from your tongue and hand", "bukhari", 10, "المسلم من سلم المسلمون", "من لسانه ويده"),
    ("Make things easy", "bukhari", 69, "يسروا ولا تعسروا", "ولا تنفروا"),
    ("The path of knowledge", "muslim", None, "من سلك طريقا يلتمس فيه علما", "طريقا إلى الجنة"),
    ("The best of you", "bukhari", 5027, "خيركم من تعلم القرآن وعلمه", None),
    ("Two rewards", "muslim", None, "الماهر بالقرآن مع السفرة الكرام البررة", "له أجران"),
    ("Three that continue", "muslim", None, "إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة", "يدعو له"),
    ("Charity does not decrease wealth", "muslim", None, "ما نقصت صدقة من مال", "إلا رفعه الله"),
    ("One body", "muslim", None, "مثل المؤمنين في توادهم وتراحمهم وتعاطفهم", "بالسهر والحمى"),
    ("Hearts and deeds", "muslim", None, "إن الله لا ينظر إلى صوركم وأموالكم", "قلوبكم وأعمالكم"),
    ("Best in character", "tirmidhi", 1162, "أكمل المؤمنين إيمانا أحسنهم خلقا", None),
    ("Best to his family", "tirmidhi", 3895, "خيركم خيركم لأهله", "وأنا خيركم لأهلي"),
    ("Mercy to the young, honour to the old", "tirmidhi", 1919, "ليس منا من لم يرحم صغيرنا", "كبيرنا"),
    ("The merciful are shown mercy", "tirmidhi", 1924, "الراحمون يرحمهم الرحمن", "من في السماء"),
    ("Your mother", "bukhari", 5971, "من أحق بحسن صحابتي", "ثم أبوك"),
    ("The neighbour", "bukhari", 6014, "ما زال", "سيورثه"),
    ("Every kindness is charity", "bukhari", 6021, "كل معروف صدقة", None),
    ("The branches of faith", "muslim", None, "الإيمان بضع وسبعون أو بضع وستون شعبة فأفضلها", "شعبة من الإيمان"),
    ("Truthfulness", "muslim", None, "إن الصدق يهدي إلى البر", "صديقا"),
    ("Three signs", "bukhari", 33, "آية المنافق ثلاث", "خان"),
    ("Beware of suspicion", "bukhari", 6064, "إياكم والظن فإن الظن أكذب الحديث", "إخوانا"),
    ("What backbiting is", "muslim", None, "أتدرون ما الغيبة", "بما يكره"),
    ("Gentleness", "muslim", None, "إن الرفق لا يكون في شيء إلا زانه", "إلا شانه"),
    ("Even the prick of a thorn", "bukhari", 5641, "ما يصيب المسلم من نصب", "من خطاياه"),
    ("Look at those below you", "muslim", None, "انظروا إلى من أسفل منكم", "نعمة الله"),
    ("True richness", "bukhari", 6446, "ليس الغنى عن كثرة العرض", "غنى النفس"),
    ("The work of your hand", "bukhari", 2072, "ما أكل أحد طعاما قط", "من عمل يده"),
    ("Easy in buying and selling", "bukhari", 2076, "رحم الله رجلا سمحا إذا باع", "وإذا اقتضى"),
    ("As the birds are provided for", "tirmidhi", 2344, "لو أنكم كنتم توكلون على الله حق توكله", "وتروح بطانا"),
    ("As My servant thinks of Me", "bukhari", 7405, "أنا عند ظن عبدي بي", "إذا ذكرني"),
    ("The living and the dead", "bukhari", 6407, "مثل الذي يذكر ربه والذي لا يذكر", "الحي والميت"),
    ("Two words", "bukhari", 6406, "كلمتان خفيفتان على اللسان", None),
    ("The last third of the night", "bukhari", 1145, "ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا", "فأغفر له"),
    ("The best of those who err", "tirmidhi", 2499, "كل ابن آدم خطاء", "التوابون"),
    ("Asked about four", "tirmidhi", 2417, "لا تزول قدما عبد يوم القيامة حتى يسأل", "أبلاه"),
    ("Guide to good", "muslim", None, "من دل على خير فله مثل أجر فاعله", None),
    ("Deeds are by their endings", "bukhari", 6607, "إنما الأعمال", "بالخواتيم"),
    # --- elsewhere in the book ---
    ("firstaccount", "tirmidhi", 413, "إن أول ما يحاسب به العبد يوم القيامة", "من عمله صلاته"),
    ("charity_short", "muslim", None, "ما نقصت صدقة", "من مال"),
    ("names99", "bukhari", 2736, "إن لله تسعة وتسعين اسما", "دخل الجنة"),
]

BOOKS = {}


def book(name):
    if name not in BOOKS:
        hs = json.load(open(os.path.join(SRC, f"ara-{name}.json"), encoding="utf-8"))["hadiths"]
        rows = []
        for h in hs:
            t = h["text"].replace(SAW, "ﷺ")
            n, idx = norm_map(t)
            rows.append((h["hadithnumber"], t, n, idx))
        BOOKS[name] = rows
    return BOOKS[name]


def cut(row, a, b, last):
    num, t, n, idx = row
    i = n.find(a)
    if i < 0:
        return None
    if b:
        j = n.rfind(b) if last else n.find(b, i)
        if j < i:
            return None
        end = idx[j + len(b) - 1] + 1
        while end < len(t) and (unicodedata.combining(t[end]) or t[end] in "ـء"):
            end += 1
    else:  # to the closing quotation mark, or the end of the text
        q = t.find('"', idx[i])
        end = q if q > 0 else len(t)
    return clean(t[idx[i]:end])


# Punctuation. The source prints most of these texts without it, so each mark is placed here by hand:
# (mark, words it goes before). A mark is added before every place those words begin.
C, CO, Q = "،", ":", "؟"
PUNCT = {
    "ontime": [(Q, "قال الصلاة"), (CO, "الصلاة على وقتها")],
    "rawatib": [(C, "بني له")],
    "tasbih": [(C, "وحمد الله"), (C, "وكبر الله"), (C, "فتلك تسعة"), (C, "وقال تمام"), (CO, "لا إله إلا الله وحده"), (C, "له الملك"),
               (C, "وهو على كل"), (C, "غفرت خطاياه")],
    "adhkar": [(CO, "سبحان الله وبحمده"), (C, "إلا أحد قال")],
    "quran": [(C, "فإنه يأتي")],
    "duha": [(CO, "صيام ثلاثة")],
    "salawat": [(C, "صلى الله عليه عشرا")],
    "tongue": [(C, "فليقل خيرا")],
    "baqarah": [(C, "كفتاه")],
    "smile": [(C, "ولو أن تلقى")],
    "names99": [(C, "مائة إلا واحدا"), (C, "من أحصاها")],
    "shukr": [(C, "إن أمره"), (C, "وليس ذاك"), (C, "إن أصابته"), (C, "وإن أصابته")],
    "monthu": [(C, "فأحب")],
    "white": [(C, "إذا صمت"), (C, "فصم ثلاث"), (C, "وأربع عشرة"), (C, "وخمس عشرة")],
    "ramadan": [(C, "غفر له")], "taraweeh": [(C, "غفر له")], "Seek the Night of Decree": [(C, "غفر له")],
    "suhoor": [(C, "فإن في السحور")],
    "shawwal": [(C, "كان كصيام")],
    "arafah": [(C, "والسنة التي بعده")],
    "The five pillars": [(CO, "شهادة أن")],
    "Do not become angry": [(CO, "أوصني"), (CO, "لا تغضب")],
    "The gates are opened": [(C, "وغلقت"), (C, "وصفدت")],
    "Taqwa wherever you are": [(C, "وأتبع السيئة"), (C, "وخالق الناس")],
    "Be mindful of Allah": [(C, "احفظ الله تجده"), (C, "إذا سألت"), (C, "وإذا استعنت")],
    "Purity is half of faith": [(C, "والحمد لله تملأ"), (C, "والصلاة نور"), (C, "والصدقة برهان"), (C, "والصبر ضياء"), (C, "والقرآن حجة")],
    "The strong believer": [(C, "وفي كل خير"), (C, "احرص على"), (C, "واستعن بالله"), (C, "ولا تعجز")],
    "The path of knowledge": [(C, "سهل الله")],
    "Two rewards": [(C, "والذي يقرأ"), (C, "له أجران")],
    "Three that continue": [(CO, "إلا من صدقة"), (C, "أو علم"), (C, "أو ولد")],
    "Charity does not decrease wealth": [(C, "وما زاد الله"), (C, "وما تواضع")],
    "One body": [(C, "إذا اشتكى")],
    "Hearts and deeds": [(C, "ولكن ينظر")],
    "Best in character": [(C, "وخياركم")],
    "Best to his family": [(C, "وأنا خيركم")],
    "The merciful are shown mercy": [(C, "ارحموا من")],
    "Your mother": [(Q, "قال أمك"), (Q, "قال ثم أبوك"), (CO, "أمك"), (CO, "ثم من"), (CO, "ثم أبوك")],
    "The branches of faith": [(C, "فأفضلها"), (C, "وأدناها"), (C, "والحياء")],
    "Truthfulness": [(C, "وإن البر"), (C, "وإن الرجل")],
    "Three signs": [(CO, "إذا حدث")],
    "What backbiting is": [(CO, "الله ورسوله"), (CO, "ذكرك أخاك")],
    "Gentleness": [(C, "ولا ينزع")],
    "Look at those below you": [(C, "ولا تنظروا"), (C, "فهو أجدر")],
    "As the birds are provided for": [(C, "لرزقتم"), (C, "تغدو خماصا")],
    "The living and the dead": [(C, "مثل الحي")],
    "The last third of the night": [(C, "حين يبقى"), (CO, "من يدعوني"), (C, "من يسألني"), (C, "من يستغفرني")],
    "The best of those who err": [(C, "وخير الخطائين")],
    "Asked about four": [(C, "وعن علمه"), (C, "وعن ماله"), (C, "وعن جسمه")],
}
# Sentence marks inside the source text that read better as another mark: (key, old, new), first one only.
REPLACE = {"What backbiting is": [(".", "؟")], "adhkar": [(".", "،")], "Purity is half of faith": [(".", "،")],
           "Fasting is for Allah": [(".", "،")]}


def punctuate(key, t):
    for old, new in REPLACE.get(key, []):
        assert old in t, (key, old)
        t = t.replace(old, new, 1)
    for mark, phrase in PUNCT.get(key, []):
        n, idx = norm_map(t)
        ph, pos, i = norm(phrase), [], 0
        while (i := n.find(ph, i)) >= 0:
            if i == 0 or n[i - 1] == " ":
                pos.append(idx[i])
            i += 1
        assert pos or key == "x", f"punctuation: '{phrase}' not found in {key}"
        for p in reversed(pos):
            head = t[:p].rstrip()
            if head and head[-1] not in "،:؟.؛":
                t = head + mark + " " + t[p:]
    return t + "."


out, bad = {}, 0
for spec in SPECS:
    key, bk, cited, a, b = spec[:5]
    last = len(spec) > 5
    a, b = norm(a), norm(b) if b else None
    rows = book(bk)
    hits = [(r[0], c) for r in rows if (c := cut(r, a, b, last))]
    if not hits:
        print(f"!! NOT FOUND  {key}  ({bk} {cited})"); bad += 1
        continue
    pick = next((h for h in hits if h[0] == cited), None) or min(hits, key=lambda h: len(h[1]))
    flag = "" if cited in (None, pick[0]) else f"   <-- cited {cited}, found at {sorted(h[0] for h in hits)[:8]}"
    print(f"{key} | {bk} {pick[0]}{flag}\n    {pick[1]}")
    out[key] = {"ar": punctuate(key, pick[1]), "book": bk, "number": pick[0]}
# Muslim gives the words "and remembrance of Allah" as an addition in the narration that follows this one.
out["tashriq"]["ar"] = out["tashriq"]["ar"].rstrip(".") + " وَذِكْرٍ لِلَّهِ."
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n{len(out)} written, {bad} not found")
