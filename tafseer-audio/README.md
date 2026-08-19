# Tafsīr Audio Files

This folder holds the audio files for the Tafsīr Audio Library at `/tafseer.html`.

## Adding a new episode

1. Add the audio file here (`.mp3` is the safest format — it plays everywhere without extra setup). Keep the filename simple, e.g. `jannee-01-al-fatihah-part1.mp3`.
2. Open `/tafseer.html` and find the `EPISODES` array near the bottom of the file. Add one entry:

   ```js
   { sheikh: "Sh. Jannee", surah: "Al-Fatihah", surahAr: "الفاتحة", title: "Introduction & Verses 1-3",
     file: "tafseer-audio/jannee-01-al-fatihah-part1.mp3",
     desc: "An overview of the Surah's themes and the meaning of the first three ayat." }
   ```

   The `sheikh` value must exactly match one of the names in the `SHEIKHS` list near the top of the same script block (currently: Sh. Jannee, Sh. Yusuf Nuuree, Sh. Mohammed Rashad, Sh. Muhammad Waadoo). To add a scholar not on that list, add their name to `SHEIKHS` first.

3. Commit and push (or, if you're doing this straight from github.com: use "Add file → Upload files" in this folder for the audio, then edit `tafseer.html` directly in the browser). The episode shows up automatically under that scholar's tab, grouped by Sūrah.

## A note on file size

GitHub Pages works best with individual files under ~50MB and a total repository size under ~1GB. For spoken-word audio, a lower bitrate (64–96kbps, mono) keeps file sizes small without hurting clarity — worth doing if the library grows to many hours of content.
