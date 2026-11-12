# Zaad: Provision for the Day

A Muslim's daily planner for 2027 (1448–1449 AH). Compiled by Feysel Reshid.

There are two editions, built from the same content:

| Edition | File | Pages | Layout |
|---|---|---|---|
| Weekly (slim, for the bag) | `Zaad-Muslim-Weekly-Planner-2027.pdf` | 186 | One week on two facing pages |
| Daily (full) | `Zaad-Muslim-Daily-Planner-2027.pdf` | 524 | One page for every day |

Both are A5 in full colour, with mirrored margins for binding and a month tab on the outer edge. Each month has its own colour and a full-page illustration: dawn, Ramadan lanterns, the Ka'bah, the road of the Hijrah and others.

In the weekly edition each day is a block with the five prayers, Duha, Witr and night prayer, the sunnah ticks of that day, four task lines and a gratitude line. The hadith of the week, its action and a name of Allah open the spread. It leaves out a few log pages (memorisation, sadaqah, knowledge) to stay thin.

The name comes from al-Baqarah 2:197: "And take provision, for the best provision is taqwa."

## What is inside

- **The hadith behind every tick.** 36 numbered hadith, each with its source. Every tick box in the planner carries the number of its hadith.
- **A day lived by the Sunnah**, from before Fajr to sleep.
- **The year:** 2027 at a glance, the Islamic dates of 1448–1449, an intention page and goals in six areas.
- **Trackers:** Qur'an khatmah, memorisation, a year of prayer to colour in, fasting through the year, sadaqah and zakah, a dua list and a knowledge log.
- **Seasons of worship:** a Ramadan plan, Ramadan day by day, the last ten nights, Eid al-Fitr and Shawwal, and the ten days of Dhul-Hijjah.
- **Six adhkar to know by heart**, with the Arabic from the Hisnul Muslim data in this repository.
- **Each month:** an opening page with a theme and an ayah, a calendar with Hijri dates and the white days, a plan page, a habit grid and a review page.
- **Each week (53):** a hadith of the week with one action, a name of Allah with its meaning, the days of the week, three goals and a short review.
- **Each day (365):** Gregorian and Hijri date, intention, a salah table (fard, on time, congregation, sunnah), Duha, Witr and night prayer, the sunnah ticks of the day, three priorities, a plan laid out between the prayers, water, heart and sleep trackers, gratitude, an evening review and one hadith.

The day page changes with the date. Fridays add the Jumu'ah ticks. Mondays, Thursdays and the white days add the sunnah fast. Ramadan, the last ten nights, the two Eids, the ten days of Dhul-Hijjah, 'Arafah, the days of Tashriq and 'Ashura each have their own badge, ticks and hadith. No fast is suggested on the Eids or the days of Tashriq.

## Before printing

- **Check the hadith.** The texts and reference numbers were written from memory, not checked against sunnah.com (the site could not be reached from the build environment). Have someone verify each one in `src/content.py` against its source.
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
| `render.js` | HTML to PDF with Chromium |
