# The Journey of Hijrah: From Makkah to Madinah

A beautiful, educational 4-player adventure for kids about the Hijrah —
the migration of Prophet Muhammad ﷺ and his companion Abu Bakr (RA)
from Makkah to Madinah in 622 CE (1 AH).

## Religious respect rule (read this first)

**Prophet Muhammad ﷺ and Abu Bakr (RA) are never depicted** — no
playable character, face, silhouette, voice, or body representing either
of them, anywhere in this game. The four playable explorers are fictional
children, clearly presented as a learning adventure *inspired by* the
places and lessons of the Hijrah, not a re-enactment of it. When the story
reaches an event involving the Prophet ﷺ and Abu Bakr (RA) — the cave,
Quba — the game shows the location, narration, timeline and Qur'an
reference, but never the people themselves. If you extend this game,
preserve that rule.

## Running it

From the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/hijrah-journey/index.html`.

## How the four players work

Up to four children play on one screen/keyboard, split by control scheme:

| Player | Controls    |
|--------|-------------|
| 1      | W A S D     |
| 2      | Arrow keys  |
| 3      | I J K L     |
| 4      | T F G H     |

On a phone or tablet, touch devices get an on-screen D-pad for each
player automatically (`js/touchControls.js`), one per corner in that
rider's clothing color — no setting to turn on, it just appears once a
touch-capable device is detected, and hides during the cave/Quba/
teamwork story panels and the pause menu. Same key codes as the keyboard
under the hood, so it's a drop-in rather than a separate input path. A
tablet in landscape gives four thumbs the most room.

This is a cooperative journey, not a race: Journey Stars are a single
shared party total, and the ending gives every player the exact same
completion reward regardless of who answered what. A landmark only needs
one rider to reach it — the whole group pauses together for that learning
moment.

## The journey

Three open-map chapters, bridged by two narrated story beats:

1. **Makkah → foothills of Jabal Thawr** (open map) — ride to the
   mountain to trigger the **Cave of Thawr** scene: narration, the Qur'an
   lesson from Surah At-Tawbah 9:40, and a short quiz (+10 stars).
2. **The Desert Route** (open map) — two optional historical stops (Why
   Leave Makkah? / A City With Two Names), a scripted teamwork moment
   (help a tired camel vs. race ahead — helping is rewarded, per the
   spec's "no one wins by leaving a friend behind" rule), then the
   landmark that carries the party on to Quba.
3. **Quba** (open map) — ride to **Masjid Quba** to trigger its scene and
   a short quiz, then the party arrives in Madinah.

That's followed by the Madinah arrival cutscene, a 5-question final quiz,
an ending screen with the four lessons (Courage, Patience, Trust in Allah,
Helping Others), and a final "Alhamdulillah" screen with a simple
what-did-you-learn checklist and Start Again / Explore History / Play With
Friends buttons.

## Content accuracy

- Every ayah in `js/ayahSystem.js` is a real, verifiable Qur'an verse with
  an exact surah:ayah reference (Surah At-Tawbah 9:40 and Surah Ash-Sharh
  94:5-6). Nothing is invented, and nothing here is a hadith presented as
  Qur'an or vice versa. If you add more ayat, keep that same rule — see
  the header comment in that file.
- `js/historySystem.js` states plainly that historians and traditional
  sources agree on 622 CE / 1 AH but do not all agree on exact day-by-day
  details, and lists source categories (sira literature, hadith
  collections, the Qur'an itself) rather than asserting one disputed
  account as certain.
- No fictional dialogue is placed in the Prophet's ﷺ or Abu Bakr's
  (RA) mouths, and neither is ever visually depicted (see the rule above).

## Save / continue

Progress (current stage, discovered landmarks, and shared Journey Stars)
is saved to the browser's `localStorage` at every landmark and whenever a
player quits to the menu, so a "Continue Saved Journey" option appears on
the setup screen. This is a static site with no backend, so progress is
per-browser only, not synced across devices.

## Audio

Every sound is synthesized with the Web Audio API — there are no audio
files, and Qur'an recitation is never used as a game sound effect. The
Du'a & Ayah Library has an optional **"Hear the Ayah"** button that uses
the browser's own text-to-speech voice, clearly labeled as a computer
voice rather than a reciter — off unless a player taps it, and unrelated
to normal game audio.

## Code layout

Fourteen focused modules under `js/`, matching the areas of
responsibility this game needs:

- `gameManager.js` — the orchestrator: game state, the chapter loop,
  input, and wiring every other module together.
- `playerController.js` / `camelController.js` — a rider's movement,
  collision and drawing, and the separate stamina model that speeds/slows
  them and drives the "tired camel" moment.
- `fourPlayerManager.js` — owns the four `Rider` instances.
- `journeyManager.js` — overall stage progress and discovered landmarks.
- `mapManager.js` — the stylized overview map (Makkah → Jabal Thawr
  → Desert Route → Quba → Madinah), lit up as reached.
- `landmarkManager.js` — where each chapter's landmarks sit and proximity
  detection.
- `historySystem.js` / `ayahSystem.js` / `quizSystem.js` — all
  content, kept as plain data so it can be checked independently of the
  code that renders it.
- `rewardSystem.js` — the shared party Journey Star total.
- `uiManager.js` — all DOM rendering and screen switching.
- `audioManager.js` — synthesized sound effects and the optional ayah
  text-to-speech.
- `saveSystem.js` — `localStorage` save/restore.
- `main.js` — the entry point.

## Scope notes

This is a static, no-build, no-server web page (like this site's other
mini-games), so a few things from a full game spec were scoped to what a
static page can honestly deliver: movement is four independent
riders on a single fixed-size map per chapter (no camera-follow or true
3D — a layered, colorful 2D scene instead), and "customize your explorer"
covers name, clothing color and camel color (backpack and water container
are always-equipped flavor, not literal pickers, since offering controls
that don't change anything would be worse than not offering them).
Multiplayer is local (one screen, split keyboard/gamepad), matching every
other multi-player mini-game on this site.
