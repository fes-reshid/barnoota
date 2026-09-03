# Noor Shield

A native Android app that combines a device-wide adult-content filter with an
Islamic reminder system: Hadith on lowering the gaze, remembrance of the
Akhirah, and encouragement toward tawbah (repentance) and istighfar (seeking
forgiveness). Built as a standalone Gradle/Kotlin project inside this repo
(`noor-shield-app/`) — it does not depend on the rest of the barnoota site.

## What it actually does

| Feature | How | Coverage |
|---|---|---|
| Network content filter | `BlockVpnService` — a local VPN that answers DNS lookups itself, returns NXDOMAIN for domains on the blocklist, forwards everything else to a real resolver (1.1.1.1) | Every app on the device, Android 8+ |
| User-added blocklist | "Block Site" tab (`BlocklistScreen` + `BlocklistRepository`) — a text input where the user adds any site they've personally encountered; stored in Room, merged into the domain list `BlockVpnService` enforces, applied live via `BlockVpnService.reload()` if the filter is already on | Every app on the device, same as above |
| On-screen image guard | `ScreenGuardAccessibilityService` — periodically calls the platform `takeScreenshot()` API, classifies the frame, blanks the screen with a Hadith reminder if flagged | Android 11+ only (API limitation, see below) |
| Hadith reminders | `ReminderWorker` (WorkManager) posts a notification every few hours, rotating through lowering-the-gaze, tawbah, istighfar, and Akhirah hadith | All supported versions |
| Tawbah journal & istighfar counter | Room-backed, fully on-device, nothing ever leaves the phone | All supported versions |

## Honest limitations — read this before telling anyone it "blocks all nudity"

1. **No app can guarantee that.** This is a barrier and a reminder, not a
   replacement for personal intention. Say so to users plainly; overpromising
   here is both a support headache and, in the app's own terms, a form of
   dishonesty to avoid.
2. **The domain blocklist (`app/src/main/res/raw/blocklist_domains.txt`) is a
   curated seed list, not an exhaustive one.** There is no practical way for
   an app to automatically discover "every" adult site — new ones appear
   constantly. For real coverage, merge in a maintained list such as
   [The Blocklist Project's porn list](https://github.com/blocklistproject/Lists)
   or a StevenBlack hosts variant, ideally refreshed periodically (a
   WorkManager job that fetches an updated list over HTTPS and rewrites it to
   app-private storage instead of a compiled resource). The "Block Site" tab
   lets the user fill gaps manually as they run into them, but it's a
   complement to a real feed, not a substitute for one.
3. **The image classifier is a placeholder.** `HeuristicSkinToneClassifier`
   uses a crude skin-tone-ratio heuristic so the detect → blur → log pipeline
   exists and can be exercised end to end. It will misfire on beach photos,
   portraits, certain wood tones, etc., and will miss non-skin-dominant
   explicit content. **Do not ship this to real users as the sole detector.**
   See "Upgrading the classifier" below.
4. **iOS cannot do the on-screen part at all.** Apple's sandboxing means a
   third-party app cannot inspect what other apps render. If you want an iOS
   companion, it is limited to the Screen Time / Family Controls API
   (Safari web-content filtering + scheduled app blocking) — a materially
   weaker guarantee than the Android accessibility-service approach used
   here. Don't market iOS and Android builds as equivalent.
5. **DNS filtering has known bypasses**: browsing by raw IP address, apps
   that hardcode DNS-over-HTTPS to a fixed resolver, or a user manually
   changing their network's private DNS setting all skip this filter. The
   on-screen guard (Android 11+) is the backstop for content that gets
   through the network layer.
6. **Android 8–10 (API 26–29) get network filtering only** — `takeScreenshot()`
   was added in API 30, so the accessibility-service image guard silently
   no-ops below that.

## Upgrading the classifier

Replace `HeuristicSkinToneClassifier` with a real on-device model:

1. Obtain or train a `.tflite` image classifier for explicit content (several
   open architectures exist, e.g. MobileNet-based NSFW classifiers — check
   the license of whichever one you use before shipping).
2. Drop the model file in `app/src/main/assets/`.
3. Implement `TfliteNsfwClassifier` (stub already in
   `filter/NsfwClassifier.kt`) using the TensorFlow Lite Android runtime
   (`org.tensorflow:tensorflow-lite`): load the model, resize the captured
   bitmap to the model's expected input, run inference, map the output score
   to `NsfwResult`.
4. Swap the `classifier` field in `ScreenGuardAccessibilityService` to use it.

This was left as a stub deliberately — bundling a specific trained model is a
licensing and accuracy decision for whoever ships this app, not something to
guess at.

## Required permissions & why

- **VPN** (`BIND_VPN_SERVICE`, requested via `VpnService.prepare()`) — needed
  to intercept DNS system-wide. The VPN never sends traffic to any external
  server; it's a purely local DNS proxy.
- **Accessibility service** — needed to call `takeScreenshot()` on other
  apps' windows. This is the only API Android exposes for this.
- **Display over other apps** (`SYSTEM_ALERT_WINDOW`) — needed to draw the
  blur/reminder overlay on top of whatever triggered it.
- **Notifications** (`POST_NOTIFICATIONS`, Android 13+) — for the periodic
  Hadith reminders and the "protection active" status notification.

All of these need **manual, individual user consent** on-device (Android
does not allow silently granting VPN/accessibility/overlay access) — see
`ui/screens/DashboardScreen.kt` for the setup checklist that walks the user
through granting each one.

## Play Store considerations

Google Play has specific policies for "family/parental control" and
"content filtering" apps (Accessibility API usage disclosure, a published
privacy policy, and — for apps primarily marketed at blocking adult content
— review under the Families/child-safety policies if targeting minors).
Read the current Google Play Developer Policy sections on Accessibility API
use and Device and Network Abuse before publishing.

## Building

Requires Android Studio (Koala+) or the command-line tools with SDK 34,
JDK 17. The Gradle wrapper is checked in:

```
cd noor-shield-app
./gradlew assembleDebug
```

This has **not** been compiled end-to-end in the environment this project
was authored in — it had no network access to Google's Maven repo
(`dl.google.com`) to download the Android Gradle Plugin and SDK artifacts.
Run `./gradlew assembleDebug` locally or in CI with normal internet access
before relying on it; fix any dependency-version mismatches that surface
(AGP/Kotlin/Compose-compiler compatibility drifts as new versions ship).

## Hadith sourcing

All Hadith text in `reminders/Hadith.kt` is cited with its source
collection/number and, where relevant, a grading note (e.g. "Hasan" vs.
"Sahih"). Translations are common English renderings for da'wah/reminder
purposes, not scholarly translations — verify against
[sunnah.com](https://sunnah.com) or a qualified scholar before relying on
this list beyond in-app reminders, and before any public release consider
having the list reviewed by someone with the qualifications to check both
wording and grading.
