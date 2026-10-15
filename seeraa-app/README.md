# Seeraa Quest — phone app (Android + iPhone)

Turns the Seeraa Quest website course (`../seeraa`) into a real app for Google Play
and the App Store, using [Capacitor](https://capacitorjs.com), the same way
`../hisnul-app` wraps Hisnul Muslim.

- App name: **Seeraa Quest**
- App id / bundle id: **`com.diinislaam.seeraa`** (this can never change after the first
  store upload, so change it in `capacitor.config.json`, `android/app/build.gradle` and the
  Xcode project *before* the first upload if you want a different one)
- Everything the course needs is bundled inside the app. Students sign in with the same
  username and password as on the website (internet needed to sign in and to sync progress).

## How it fits together

```
seeraa/                      the website course (edit the course here, as always)
kids-quest-cloud.js          shared student accounts (Firebase)
seeraa-app/
  scripts/build-www.mjs      copies the course into www/ and adjusts it for phones
  src/app-speech.js          gives Android the phone's voice for "Listen" and the Arabic buttons
  assets/                    icon + launch screen artwork (scripts/make-art.mjs draws them)
  android/                   Android Studio project
  ios/                       Xcode project
```

`build-www.mjs` makes three phone-only adjustments to the copy (the website is untouched):

1. **Sign-in on iPhone** – uses `initializeAuth` instead of `getAuth`, which otherwise hangs
   inside an iOS app.
2. **Notches and home bars** – `viewport-fit=cover` + `app-shell.css` keep the map, menus and
   lessons inside the safe area.
3. **Speech on Android** – Android's in-app browser cannot speak, so `app-speech.js` hands
   speech to the phone's own text-to-speech voice.

## After changing the course

```
cd seeraa-app
npm install        # first time only
npm run sync       # rebuild www/ from ../seeraa and copy it into android/ and ios/
```

Every push to `main` that touches `seeraa/`, `seeraa-app/` or `kids-quest-cloud.js` also
runs **GitHub → Actions → "Seeraa Quest app"**, which:

- builds a **test APK** — open the run, download `seeraa-quest-android-test`, unzip it and
  install `app-debug.apk` on an Android phone (allow "install unknown apps" when asked);
- checks the **iPhone** app compiles.

## Version numbers (raise them for every store update)

- Android: `versionCode` (1, 2, 3 …) and `versionName` ("1.0", "1.1" …) in `android/app/build.gradle`
- iPhone: in Xcode, target **App → General → Version / Build**

## Icon and launch screen

```
node scripts/make-art.mjs   # needs Playwright (npm i -D playwright, or a global install)
npm run assets              # makes every Android and iOS size from assets/
```

---

## Publishing on Google Play

You already have a Play developer account (Hisnul Muslim is published).

1. **Build the release bundle** in Android Studio: `npx cap open android`, then
   **Build › Generate Signed Bundle / APK › Android App Bundle**. The first time, click
   **Create new…** to make a signing keystore. **Back up the keystore file and its passwords
   somewhere safe** — without them you can never update this app again. Output:
   `android/app/release/app-release.aab`.
2. In Play Console, **Create app** → name "Seeraa Quest", app, free.
3. Complete **App content**:
   - **Privacy policy**: `https://diinislaam.com/privacy-policy.html` (see "Before you submit" below)
   - **Ads**: no ads
   - **App access**: sign-in required → give a **test student username and password** for the reviewers
   - **Target audience**: includes children → the app falls under Google Play's **Families**
     policy (no ads, nothing collected beyond what the course needs — this app qualifies)
   - **Data safety**: collects *name* (student name), *user IDs* (username), *app activity*
     (lesson progress), and *audio* (only recordings a student chooses to send to their
     teacher); all sent over HTTPS, not shared, not used for advertising; accounts are created
     and deleted by the school/admin
   - **Content rating** questionnaire (educational, no violence beyond the gentle battle scenes)
4. **Store listing**: short + full description, the 512×512 icon (`assets/icon-only.png`
   scaled down), a 1024×500 feature graphic, and at least 2 phone screenshots.
5. Upload the `.aab` to **Internal testing** first, try it on a phone, then promote to **Production**.

## Publishing on the App Store

Needs a **Mac with Xcode 16 or newer** and an **Apple Developer Program** membership
(US$99 a year — as an organisation, enrol with your D-U-N-S number).

1. On the Mac: `git clone` the repo, then `cd seeraa-app && npm install && npm run sync && npx cap open ios`.
2. In Xcode: target **App → Signing & Capabilities** → choose your **Team**
   (keep the bundle id `com.diinislaam.seeraa`).
3. In [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → +** → new app,
   bundle id `com.diinislaam.seeraa`, name "Seeraa Quest", primary category **Education**.
4. In Xcode choose **Any iOS Device**, then **Product › Archive** → **Distribute App** →
   **App Store Connect** → upload. Test it with **TestFlight** before submitting.
5. Fill in the listing: description, keywords, support URL (`https://diinislaam.com`),
   privacy policy URL, screenshots (6.9" and 6.5" iPhone, 13" iPad), age rating.
6. **App Privacy**: same data as the Google Play list above, all *linked to the user*,
   *not used for tracking*.
7. **App Review Information**: sign-in is required, so give a **demo student username and
   password**. Mention that accounts are created by teachers, so there is no sign-up in the app.
8. The **Kids** category is optional. If you choose it, Apple also asks for a parental gate
   before links that leave the app (the teacher link in Teacher mode opens the website), so
   the simplest first release is the **Education** category with age rating 4+.

## Before you submit (both stores)

- **Privacy policy**: it covers student accounts, Firebase and children, but not voice
  recordings yet. Suggested paragraph to add:

  > *Voice recordings.* In Seeraa Quest and Tajweed Quest a student can choose to record
  > themselves reciting and send the recording to their teacher. The microphone is only used
  > while the student is recording. Recordings are stored with the student's account in Google
  > Firebase and can be heard only by the student and their teachers.

- **Firebase**: if the Firebase API key is restricted to `diinislaam.com` in the Google Cloud
  console, allow the app too, or sign-in will fail in the app only.
- **Demo account**: create one test student for the reviewers of each store.
