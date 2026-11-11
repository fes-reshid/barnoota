# Audio recordings for the online book

Until recordings are added, the **Listen** buttons use the reader's device voice
(text-to-speech). To use your own recordings instead:

1. Save each recording as an MP3 named with the two-digit hadith number:
   - Arabic: `audio/ar/01.mp3` … `audio/ar/50.mp3`
   - English: `audio/en/01.mp3` … `audio/en/50.mp3`
2. Run `python3 arbaeen-nawawi-book/build_web.py` from the repository root.
   It lists the recordings it finds in `data.js`.
3. Commit and push. From then on those hadith play your recording, and the
   others keep using the device voice.

You can add recordings a few at a time.
