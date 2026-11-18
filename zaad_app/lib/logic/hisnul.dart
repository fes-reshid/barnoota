import 'package:android_intent_plus/android_intent.dart';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

/// Your Hisnul Muslim app: a native Android app and a web app that also works offline.
const hisnulAndroidPackage = 'com.diinislaam.hisnulmuslim';
const hisnulPlayStore = 'https://play.google.com/store/apps/details?id=$hisnulAndroidPackage';
const hisnulWeb = 'https://diinislaam.com/hisnul-muslim/';

/// Chapters of Hisnul Muslim as numbered in the app.
const hisnulMorning = 27;
const hisnulEvening = 999;

String hisnulWebUrl(int chapter) => '$hisnulWeb#/category/$chapter';

/// How the app sends someone to Hisnul Muslim. The app uses [openHisnul]; tests give their own.
typedef HisnulOpener = Future<void> Function(int chapter);

/// On Android, opens the Hisnul Muslim app if it is installed. Everywhere else (and when it is not installed)
/// it opens the web version at the chapter, which works at once.
Future<void> openHisnul(int chapter) async {
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    try {
      final intent = AndroidIntent(
        action: 'action_main',
        category: 'android.intent.category.LAUNCHER',
        package: hisnulAndroidPackage,
      );
      if (await intent.canResolveActivity() ?? false) {
        await intent.launch();
        return;
      }
    } catch (_) {
      // fall through to the web version
    }
  }
  await launchUrl(Uri.parse(hisnulWebUrl(chapter)), mode: LaunchMode.externalApplication);
}

/// Opens the Play Store page of the Hisnul Muslim app.
Future<void> openHisnulStore() => launchUrl(Uri.parse(hisnulPlayStore), mode: LaunchMode.externalApplication);
