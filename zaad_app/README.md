# Zaad: your day, prayer by prayer

A phone app for Android and iPhone. It is the companion to the printed Zaad planner (`../zaad-planner`), but a different idea: instead of a page to fill in, **the day is built around the five prayers**, worked out for where you are.

- **Today:** a 24-hour ring with the five prayers on it and the time to the next one. Below it, the day in windows (before Fajr, Fajr, Duha, Dhuhr, 'Asr, Maghrib, 'Isha). Each window holds its prayer (prayed, on time, in jama'ah, sunnah, dhikr after) and the Sunnah acts that belong to it. The window you are in is open.
- **The hadith behind every tick:** tap the book icon beside any act to read the hadith in Arabic and English, with its narrator and source.
- **Special days** change the day by themselves: Fridays, Ramadan (suhoor, fasting, iftar, tarawih, the last ten nights), the two Eids, the first ten days of Dhul-Hijjah, 'Arafah, 'Ashura, the white days and Mondays and Thursdays.
- **99 Names of Allah:** two to memorise each week, with flashcards that bring back the ones you miss sooner (spaced repetition), and one line a day on how to live by the name.
- **Qibla:** a compass with the Ka'bah on it.
- **Journey:** streaks, the last seven days, a Hijri calendar coloured by your prayers, a Qur'an juz tracker and a list of your duas.
- **Reminders:** at each prayer time, ten minutes before, and for morning and evening adhkar. Scheduled on the phone.
- **Private:** no account, no ads, no server, works without internet. Location is used on the phone only to work out the prayer times. A backup can be copied and pasted.

The names, hadith (with narrators), weekly hadith and Sunnahs are generated from the same sources as the printed planner (`python3 ../zaad-planner/tools/build_app_data.py` writes `assets/data/content.json`). The Hijri dates are Umm al-Qura and were checked against the planner for every day of 2026 to 2028. The special days and the name of Allah for each day were checked against the planner for every day of 2027.

## Run and test

Needs [Flutter](https://docs.flutter.dev/get-started/install) 3.50 or newer.

```bash
cd zaad_app
flutter pub get
flutter run
```

```bash
flutter analyze
TZ=Australia/Melbourne flutter test test/logic_test.dart test/app_test.dart
```

The screenshots in `test/goldens/` are drawn by `test/golden_test.dart`, so the design can be looked at without a phone. Make them again with:

```bash
TZ=Australia/Melbourne flutter test --update-goldens test/golden_test.dart
```

## What was and was not checked

Checked here: the code analyses with no issues; 23 tests pass (prayer times in Melbourne, the Qibla, the Hijri calendar, every day of 2027 against the printed planner, the memorising schedule, backup and restore, tapping prayers and tasks, onboarding); and every screen was drawn and looked at, in light and dark.

**Not checked here, because this environment has no phone, no Android SDK and no Xcode:** the Android and iPhone builds themselves, and the things only a real phone can show (the location prompt, notifications arriving at the right minute, the compass). The GitHub workflow `.github/workflows/zaad-app.yml` builds the Android APK and compiles the iPhone app. **Install the APK on a phone and try the reminders and the compass before you publish.**

## Putting it in the stores

The app id is `com.diinislaam.zaad` (Android) and the same bundle id on iPhone. It can never change after the first upload.

### Google Play (Android)

1. Create a Google Play developer account (a one-time fee).
2. Make an upload key once, and keep the file and passwords safe:

   ```bash
   keytool -genkey -v -keystore ~/zaad-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

3. Create `android/key.properties` (it is not committed):

   ```
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=/full/path/to/zaad-upload.jks
   ```

4. Build the bundle and upload `build/app/outputs/bundle/release/app-release.aab` in Play Console:

   ```bash
   flutter build appbundle
   ```

5. Raise `version` in `pubspec.yaml` (for example `1.0.1+2`) before every update. The number after the plus must always go up.

### App Store (iPhone)

Needs a Mac with Xcode and an Apple developer account (a yearly fee).

```bash
flutter build ipa
```

Open `ios/Runner.xcworkspace` in Xcode once, choose your team under Signing and Capabilities, then upload with Xcode or the Transporter app and test with TestFlight first.

### Both stores ask for

- **A privacy policy address.** The app collects nothing and sends nothing. Say so on diinislaam.com/privacy-policy.html, and say that the location is used only on the phone to work out prayer times and the Qibla.
- **Data safety (Google) and privacy labels (Apple):** data collected: none.
- **Exact alarms (Google):** the app asks for the "alarms and reminders" permission so that prayer reminders arrive on the minute. Play Console asks why; the answer is prayer-time reminders. If you would rather not use it, remove `SCHEDULE_EXACT_ALARM` from the manifest and the reminders may come a few minutes late.
- **Screenshots:** the pictures in `test/goldens/` show the layout. Take real ones from a phone for the listing.

## Changing things

| What | Where |
|---|---|
| The content (names, hadith, Sunnahs) | `../zaad-planner/src/content.py`, then `python3 ../zaad-planner/tools/build_app_data.py` |
| Which tasks belong to which window, and the special days | `lib/logic/plan.dart` |
| Prayer-time methods | `lib/logic/prayer.dart` |
| Cities offered | `lib/data/cities.dart` |
| Colours and fonts | `lib/core/theme.dart` and `assets/fonts` (Scheherazade New, Lora, Cinzel and Inter, all under the SIL Open Font License; the licences are in the same folder) |
| Icon and launch screen | `node tool/make_icons.js`, then `dart run flutter_launcher_icons` and `dart run flutter_native_splash:create` |

## Not in this version

A home-screen widget showing the next prayer, the adhan sound, other languages (the app is in English; the names and hadith carry Arabic), and syncing between phones (use the backup to move data).
