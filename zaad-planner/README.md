# Zaad: Provision for the Day

A Muslim's daily planner for 2027 (1448–1449 AH). Compiled by Feysel Reshid.

There are two editions, built from the same content:

| Edition | File | Pages | Layout |
|---|---|---|---|
| Weekly (slim, for the bag) | `Zaad-Muslim-Weekly-Planner-2027.pdf` | 178 | One week on two facing pages |
| Daily (full) | `Zaad-Muslim-Daily-Planner-2027.pdf` | 430 | One page for every day |

Both are A5 in full colour, with mirrored margins for binding and a month tab on the outer edge. Each month has its own colour and a full-page illustration: dawn, Ramadan lanterns, the Ka'bah, the road of the Hijrah and others.

In the weekly edition each day is a block with the five prayers, Duha, Witr and night prayer, the sunnah ticks of that day, four task lines and a gratitude line. The hadith of the week, its action and a name of Allah open the spread. It leaves out a few log pages (memorisation, sadaqah, knowledge) to stay thin.

The name comes from al-Baqarah 2:197: "And take provision, for the best provision is taqwa."

## What is inside

- **Hadith in Arabic and English** at the foot of each day (daily edition) and for each week. The front list "The hadith behind every tick" and the small numbers beside the ticks are switched off (`TICK_LIST` in `build.py`).
- **A day lived by the Sunnah**, from before Fajr to sleep.
- **The year:** 2027 at a glance, the Islamic dates of 1448–1449, an intention page and goals in six areas.
- **Trackers:** Qur'an khatmah, memorisation, a year of prayer to colour in, fasting through the year, sadaqah and zakah, a dua list and a knowledge log.
- **Seasons of worship:** a Ramadan plan, Ramadan day by day, the last ten nights, Eid al-Fitr and Shawwal, and the ten days of Dhul-Hijjah.
- **Six adhkar to know by heart**, with the Arabic from the Hisnul Muslim data in this repository.
- **Each month:** an opening page with a theme and an ayah, a calendar with Hijri dates and the white days, and one page for the intention, goals and habit grid.
- **Each week (53):** a hadith of the week with one action, and a name of Allah with its meaning. In the daily edition they sit at the foot of the first day of the week; in the weekly edition they open the spread.
- **Each day (365):** Gregorian and Hijri date, intention, a salah table (fard, on time, congregation, sunnah), Duha, Witr and night prayer, the sunnah ticks of the day, three priorities, a plan laid out between the prayers, water, heart and sleep trackers, gratitude, an evening review and one hadith.

The day page changes with the date. Fridays add the Jumu'ah ticks. Mondays, Thursdays and the white days add the sunnah fast. Ramadan, the last ten nights, the two Eids, the ten days of Dhul-Hijjah, 'Arafah, the days of Tashriq and 'Ashura each have their own badge, ticks and hadith. No fast is suggested on the Eids or the days of Tashriq.

## The Arabic and the references

Every hadith is printed in Arabic and English. The Arabic is taken from the source collections (the editions of github.com/fawazahmed0/hadith-api) by `tools/fetch_arabic.py`, which finds each hadith by its opening and closing words and saves the result in `src/arabic.json`.

- **Checked against the source:** the text of all 93 hadith, and the hadith numbers cited from al-Bukhari, at-Tirmidhi and Abu Dawud.
- **Not checked by number:** the Muslim numbers. They follow the numbering used on sunnah.com, which the source files do not carry. Each text was found in Sahih Muslim.
- **Typed by hand:** the hadith of Surat al-Kahf (al-Hakim), the dua of Laylat al-Qadr (at-Tirmidhi 3513), the saying of 'Umar, the closing dua, and the 53 names of Allah. The six adhkar come from the Hisnul Muslim data in this repository.
- **The English** is worded for a planner and is not a published translation.

## Before printing

- Have someone who knows the texts read the hand-typed items above and the English wording.
- **Check the Hijri dates.** They follow the Umm al-Qura calendar through the `hijridate` package. Local moon sighting can move a date by a day. The planner says so and gives a "Local" tick for each date.

## Building

The build needs Python 3 with `hijridate`, Node, and Playwright Chromium. The fonts are shared with `../arbaeen-nawawi-book/fonts`.

```bash
python3 build.py
```

```bash
EDITION=weekly python3 build.py
```

```bash
SAMPLE=1 python3 build.py
```

The first builds the daily edition and the second the weekly one. The third builds only the front matter and the first ten days, for a quick look. The build prints a warning if any page's content does not fit.

| File | Contents |
|---|---|
| `src/content.py` | The hadith, the weekly hadith and actions, the names of Allah, month themes and ayat |
| `src/art.py` | The cover and month illustrations and the prayer icons, drawn as SVG |
| `src/planner.css` | The design |
| `build.py` | Dates, page layouts and assembly. Change `YEAR` for another year |
| `tools/fetch_arabic.py` | Fetches the Arabic of each hadith into `src/arabic.json` (only needed when a hadith is added) |
| `render.js` | HTML to PDF with Chromium |
