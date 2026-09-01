# Hisnul Muslim — native app wrapper (Capacitor)

Wraps the static web app in `../hisnul-muslim` as a native Android/iOS app,
with all audio and app files bundled into the app package itself (no
post-install download).

## One-time setup

```
npm install
```

## After changing anything in ../hisnul-muslim

Re-copy the latest web app (including audio/) into the native projects:

```
npx cap sync
```

## Android

Requires [Android Studio](https://developer.android.com/studio) (it manages
the Android SDK for you — this repo doesn't commit one).

```
npx cap open android
```

Android Studio will open the `android/` project. From there:
- **Run** ▶ on an emulator/device to test.
- **Build > Generate Signed Bundle / APK** to produce a release `.aab` for
  the Play Store (you'll need to create a signing keystore the first time —
  Android Studio walks you through it).

App id: `com.diinislaam.hisnulmuslim`. Change it in `capacitor.config.json`
and `android/app/build.gradle` (`applicationId`) before publishing if you
want a different one — it can't be changed after the first Play Store
upload.

## Publishing to Google Play

One-time prep:
- A [Google Play Developer account](https://play.google.com/console/signup)
  ($25 one-time registration fee).
- `../hisnul-muslim/privacy.html` needs to be live at a public URL (e.g.
  `http://diinislaam.com/hisnul-muslim/privacy.html`) — Play Console checks
  that it actually loads.
- Store listing assets: a 512×512 icon, a 1024×500 feature graphic, and at
  least 2 phone screenshots.

Build the release bundle in Android Studio: **Build > Generate Signed
Bundle / APK > Android App Bundle**. First time, click **Create new...** to
make a signing keystore — pick a strong password, 25+ year validity, and
**back the keystore file and its passwords up somewhere safe**. Losing it
means never being able to publish an update to this same app listing again.
Output lands at `android/app/release/app-release.aab`.

In Play Console, **Create app**, then work through everything under **App
content** before a release is allowed:
- **Privacy policy** — the URL above
- **Ads** — Yes (AdMob; see below)
- **App access** — all functionality available without special access
- **Content rating**, **Target audience**, **Data safety** — fill out
  honestly; Data safety should mirror `privacy.html` (advertising ID via
  AdMob, everything else stored only on-device)
- Government apps / COVID-19 / Financial features / News apps — all No

Then **Release > Testing > Internal testing** (recommended first) or
**Production**, create a release, upload the `.aab`, and roll out. First
review typically takes hours to a few days.

## iOS

Requires a Mac with Xcode. From a Mac:

```
npm install
npx cap add ios
npx cap sync
npx cap open ios
```

Then archive and upload from Xcode as usual, or via
[App Store Connect](https://appstoreconnect.apple.com/).

## AdMob

The native app shows ads via `@capacitor-community/admob` (the website
uses AdSense instead — see `hisnul-muslim/app.js`'s `isNativeApp()` guard,
which keeps the two from ever running in the same place). Two IDs, both
real, both from the [AdMob console](https://admob.google.com):
- **App ID** — `android/app/src/main/AndroidManifest.xml`'s
  `com.google.android.gms.ads.APPLICATION_ID` meta-data
- **Banner ad unit ID** — `ADMOB_BANNER_UNIT_ID` in `../hisnul-muslim/app.js`

`initAdMob()` (also in `app.js`) initializes the SDK and shows a bottom
adaptive banner on every page, once at boot. Ad serving is limited by
Google until the app is published on Play and passes review — a blank or
empty banner before then is expected, not a bug.

## Prayer-time reminder notifications

`reminders.js` (in the web app) now detects `window.Capacitor` and, when
running inside this native wrapper, schedules real OS notifications via
`@capacitor/local-notifications` instead of the Web Notification API —
those fire on time even while the app is backgrounded or fully closed,
which a WebView can't do on its own. It falls back to the original
setTimeout-while-open behavior when running as the plain web PWA (where
`Capacitor` doesn't exist).

One thing to be aware of: Android 12+ gates exact-time alarms behind the
`SCHEDULE_EXACT_ALARM` permission (already declared automatically by the
plugin's manifest). Most users get it by default, but if a device denies it,
reminders may arrive a few minutes late rather than not at all — nothing
further to configure, just worth knowing if a reminder looks slightly off.

## Known gaps to revisit

- **Adaptive icon** foreground is the flat icon fully bleeding to the edges,
  so Android's circular icon mask (Pixel launchers etc.) clips the top of
  the Arabic diacritics slightly. Fine for now; a version with a bit more
  padding around the calligraphy would crop more cleanly if it's worth a
  touch-up later.
- The app already works fully offline for everything in `../hisnul-muslim`
  (all du'a text/audio is bundled); only the prayer-times API call and the
  handful of archive.org-hosted fallback tracks still need network.
