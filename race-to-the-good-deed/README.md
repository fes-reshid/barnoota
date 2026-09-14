# Race to the Good Deed

*Run Fast. Help Others. Do Good.*

A colorful 4-player platform-racing adventure for kids. Four racers dash
through obstacle courses full of hills, ramps, bridges, springs, gaps and
moving platforms toward a Good Deed Station, picking up bonus tokens and
helping each other along the way. No combat, no weapons, no "worst
player" — the point is racing, teamwork, and thinking through good-choice
questions.

## About the characters (an IP note)

This game was requested with Sonic, Tails, Knuckles and Amy as the four
racers. **This site has no license for those characters**, and the
request itself said to use original equivalents rather than copyrighted
assets if that's the case — so the four racers here are original:

| Player | Character | Color  | Ability |
|--------|-----------|--------|---------|
| 1      | **Zayd**   | Blue   | Super Speed — a temporary speed burst |
| 2      | **Layla**  | Orange | Flight — glide briefly to cross gaps |
| 3      | **Malik**  | Red    | Power — smash through breakable rocks |
| 4      | **Amira**  | Pink   | Hammer Switch — activate switches |

Same colors, same four ability concepts, same fixed player-to-character
mapping as specced — just with original names and original (simple,
non-anthropomorphic-animal) designs instead of someone else's IP.

## Running it

From the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/race-to-the-good-deed/index.html`.

## Testing with four players

The game is always exactly four players, one screen, split keyboard —
hold **Right** to run in each zone:

| Player | Character | Right (run) | Up (jump) | Down (slide) | Left (ability) |
|--------|-----------|--------------|-----------|---------------|-----------------|
| 1      | Zayd      | D            | W         | S             | A               |
| 2      | Layla     | Arrow Right  | Arrow Up  | Arrow Down    | Arrow Left      |
| 3      | Malik     | L            | I         | K             | J               |
| 4      | Amira     | H            | T         | G             | F               |

Jump again while airborne for a double jump. On the character-select
screen, each player presses their own **Ability** key to "ready up" —
that's a real, working confirmation step, not a fake button.

### On a phone or tablet

Touch devices get RUN / JUMP / ABILITY buttons for each player
automatically (`js/touchControls.js`), one cluster per corner in that
character's color — no setting to turn on. Slide is keyboard-only, left
off touch controls to keep each corner to three buttons; it's a
nice-to-have, not required to finish a level. The buttons hide during
the pause menu and the finish-line question, and reappear once you're
back racing. A tablet in landscape gives four thumbs the room they need.

Suggested test pass:
1. From the menu, **Play** (or **Level Select** to choose deliberately) →
   ready up all four players → good deed reveal → level intro → the
   READY/3/2/1/BISMILLAH!/GO! countdown → the race.
2. Move each racer independently and confirm the other three aren't
   affected.
3. Try each ability at least once: Zayd's burst, Layla flying over the
   level's wide gap, Malik smashing the breakable rock, Amira opening a
   switch-gate. Confirm a switch someone opens stays open afterward.
4. On **Helping Friends** (Level 5), reach the Teamwork Gate near the end
   and confirm it only opens once all four abilities have been used at
   their spot — that's the one place the four players truly need each
   other.
5. Cross a checkpoint, collect a token of each kind, and get "bumped" by
   a hazard to see the friendly "KEEP GOING!" message.
6. Reach the Good Deed Station, answer the finish question either way,
   and confirm every player still gets a positive Speed/Kindness/Teamwork
   star result — never a single "1st place is the best person" verdict.

## Balance

Every level shares one safe layout shape (see `levelManager.js`): the
main ground path never has a hard, ability-gated block on it, so no
character can ever get permanently stuck. Each ability instead unlocks a
genuine *shortcut* — skip a slow shuttle-platform wait by flying, skip an
"over the hill" detour by smashing through or opening a gate — so a
race's outcome depends on using your character well, not on which
character you were assigned.

## Content accuracy

- Every Qur'an/hadith entry in `js/learningLibrary.js`'s `QURAN_HADITH_LIBRARY`
  is real, with an exact surah:ayah or named hadith-collection source —
  nothing invented. The short post-level value cards (Kindness, Charity,
  Honesty, Patience, Helping Others) are plain child-friendly statements,
  not religious citations.
- Good-deed questions never have a shaming wrong-answer message — getting
  it wrong still says something encouraging and still shows the right
  answer.
- Tokens, stars, and "GOOD CHOICE!" messages are always framed as game
  bonuses, never as literally equal to religious reward.

## Audio

All sound effects and the optional ambient music are synthesized with
the Web Audio API — no audio files, and Qur'an recitation is never used
as a sound effect. The starting-line "Bismillah! / Go!" cue can
optionally be spoken with the browser's own text-to-speech (Voice
Volume in Settings controls this, separate from SFX and Music).

## Save / progress

Completed levels, best times, discovered good deeds, and settings are
saved to the browser's `localStorage`. Levels unlock in order — see
`saveSystem.js`'s `isLevelUnlocked`.

## Code layout

Matches the requested module breakdown:

- `gameManager.js` — the state machine, race loop, input, and wiring.
- `fourPlayerManager.js` — owns the four fixed-character racers.
- `characterManager.js` — character data (name/color/ability/speed).
- `playerController.js` — shared physics/collision/drawing (`Racer`).
- `zaydController.js` / `laylaController.js` / `malikController.js` /
  `amiraController.js` — each character's unique ability on top of the
  shared `Racer` physics.
- `abilitySystem.js` — small shared cooldown helpers.
- `raceManager.js` — live position ranking, distance-to-goal, the
  starting countdown.
- `checkpointManager.js` / `obstacleManager.js` / `collectibleManager.js`
  — checkpoints, all physical collision (ground/gaps/platforms/springs/
  rocks/gates/hazards), and the four token types.
- `goodDeedManager.js` — the list of good deeds and which finish question
  goes with each.
- `questionSystem.js` — every good-deed question, with its correct answer.
- `teamworkSystem.js` — the cooperative Teamwork Gate.
- `levelManager.js` — the five levels, built from one shared, safe layout.
- `scoreManager.js` — turns what happened into three 1-5 star ratings.
- `uiManager.js` — all DOM rendering and screen switching.
- `miniMapManager.js` — the corner mini-map.
- `audioManager.js` — synthesized sound effects, music, and voice lines.
- `learningLibrary.js` — the Good Deed Library and Qur'an/Hadith content.
- `saveSystem.js` / `settingsManager.js` — persistence.
- `main.js` — the entry point.

## Scope notes

A few things from the original spec were scoped to what a static,
no-build, no-server page can honestly deliver (matching every other
mini-game on this site):

- **Art**: a colorful layered 2D scene (Canvas 2D), not a 3D engine.
  "Loops" appear as decoration rather than physically-simulated
  loop-the-loops.
- **Five levels** share one well-tested layout shape with different
  theming, colors, and good deeds, rather than five entirely bespoke
  obstacle courses — see `levelManager.js`'s header comment. This keeps
  every level verified-completable by all four characters.
- **Controller support**: not implemented in this build (keyboard only);
  the code's input layer is isolated in `gameManager.js`'s `_buildInput`,
  so a Gamepad API layer could be added later without touching physics.
- **"Controller/Keyboard Settings"** in the Settings screen shows the
  fixed control zones rather than offering remapping, since every key
  already belongs to exactly one of the four players in a shared local
  game — remapping would just create conflicts.
- Malik's ability engine supports wall-climbing (see `obstacleManager.js`),
  but no shipped level places a climbable wall on player's path yet, to
  avoid an unverified block risk — his rock-breaking is what's tested and
  live in this build.
