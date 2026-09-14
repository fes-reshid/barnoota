# Du'a Tag

A colorful, local 4-player Islamic-themed tag game. One player is "It" and
chases the others around a courtyard-garden map. Getting tagged pops up a
short, authentic du'a (supplication) to read; pressing **"I Recited It"**
makes that player the new "It" and gives them 30 seconds of protection
before the chase resumes.

This is a static, no-build, no-server web page — open `index.html` (or
serve the folder) and it runs entirely in the browser.

## Running it

From the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/dua-tag/index.html` in a browser. (Opening
the file directly with `file://` also mostly works, but some browsers block
`type="module"` scripts on `file://` — serving it avoids that.)

## Testing with four players locally

The whole game runs on one screen/keyboard, split by control scheme:

| Player | Controls    |
|--------|-------------|
| 1      | W A S D     |
| 2      | Arrow keys  |
| 3      | I J K L     |
| 4      | T F G H     |

Game controllers (Gamepad API) also work if connected — left stick or
D-pad moves each player, matched to the same player slot as a gamepad's
index.

To try it with four people at once, either gather four sets of hands
around one keyboard (the layout above is deliberately spread across the
keyboard so hands don't collide), or plug in up to four USB/Bluetooth
controllers.

Suggested test pass:
1. From the main menu, choose **Play**, pick a mode, optionally rename the
   four players, and press **Start Game**.
2. Have each player move with their control scheme and confirm no one
   else's movement is affected.
3. Let "It" catch someone — confirm the tagged player freezes, the du'a
   popup appears (in **Du'a Tag** and **Practice Mode**), and pressing
   "I Recited It" transfers "It" and starts the 30-second protection glow.
4. Confirm the newly-tagged "It" cannot immediately re-tag anyone (they're
   tag-locked for the same 30 seconds).
5. Try **Classic Tag** mode to confirm tags work the same way but skip the
   du'a popup, with a short 3-second breather instead.
6. Try **Practice Mode** to confirm there's no round timer — it's just for
   getting comfortable with the du'as.
7. Check **Pause** (Esc or the pause button), **Du'a Library**, and
   **Settings** (mute, music, text size, Arabic text size).

## Where to add more du'as

All du'a content lives in one place: `js/duaLibraryData.js`. Every entry
must be tagged honestly as `category: 'quran'` (a real, cited Qur'an ayah)
or `category: 'hadith'` (a real, named hadith collection) — never invented,
and never blended between the two. The file's header comment repeats this
rule; read it before adding anything. A new entry looks like:

```js
{
  id: 'unique-id',
  category: 'quran' | 'hadith',
  arabic: '...',
  transliteration: '...',
  english: '...',
  source: 'Qur’an, Surah X (n:n)'  // or a named hadith collection
}
```

If you're not fully sure of a wording or citation, check it with a
knowledgeable local source before adding it — this file is the single
source of truth for both the in-game tag popup and the Du'a Library
screen, so an error there shows up in both places.

## Code layout

Each concern is a separate ES module under `js/`, so a piece can be
changed (or replaced — e.g. swapping in real networked multiplayer later)
without touching the others:

- `duaLibraryData.js` — the du'a content and lookup/pick helpers.
- `playerController.js` — the `Player` class: movement, collision, drawing,
  the four control schemes, and the colorblind-safe color palette.
- `tagSystem.js` — pure tag-detection and role-transfer logic (no
  rendering, no input).
- `duaSystem.js` — tracks which du'a is currently shown for a tagged
  player and picks the next one.
- `protectionTimer.js` — turns a protection deadline into the HUD's
  whole-second countdown and its tick/end sounds.
- `mapEnvironment.js` — the courtyard map's obstacles and drawing (a
  generic, cheerful geometric-pattern garden, not a depiction of any real
  sacred site).
- `audioManager.js` — every sound effect and the background music pad, all
  synthesized with the Web Audio API (no audio files, and never Qur'an
  recitation as a sound effect).
- `ui.js` — all DOM rendering: menu, setup, HUD, du'a modal, library,
  settings, pause, round summary.
- `gameManager.js` — the orchestrator: game state, the animation loop,
  keyboard/gamepad input, and wiring everything above together.
- `main.js` — the entry point.

## About the du'a-and-protection mechanic

Reciting a du'a here is just how this game's "safe zone" works, the same
way tapping a tree is "base" in ordinary tag — it's a game mechanic, not a
form of worship, and it isn't presented as something Allah rewards or
judges. The "How to Play" screen says this directly to players.

## Adding real networked multiplayer later

This build is local-only by design (four players, one screen/keyboard).
The code is already split so a networking layer could be added later
without rewriting the game itself:

- `Player` has a `connected` flag, unused locally but ready for a
  disconnect/reconnect flow.
- `tagSystem.js` is pure functions operating on plain player state, so a
  server could run the same functions authoritatively and just broadcast
  the resulting state.
- `gameManager.js` is the only module that would need a networked
  counterpart (replacing its local input-and-simulation loop with
  send-input/receive-state); everything else stays the same.
