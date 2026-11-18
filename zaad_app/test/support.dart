import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad/app_state.dart';
import 'package:zaad/data/content.dart';
import 'package:zaad/data/store.dart';
import 'package:zaad/logic/reminders.dart';

/// Renders each screen to a picture, with the real fonts, so the design can be looked at without a phone.
/// Run with: TZ=Australia/Melbourne flutter test --update-goldens test/golden_test.dart
Future<void> loadFonts() async {
  Future<void> load(String family, List<String> files) async {
    final l = FontLoader(family);
    for (final f in files) {
      l.addFont(rootBundle.load('assets/fonts/$f'));
    }
    await l.load();
  }

  // the icons come from the Flutter SDK when the app is built; the test has to load them itself
  final icons = FontLoader('MaterialIcons')
    ..addFont(File('${Platform.environment['FLUTTER_ROOT']}/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf').readAsBytes().then((b) => ByteData.view(b.buffer)));
  await icons.load();
  await load('Scheherazade', ['ScheherazadeNew-Regular.ttf']);
  await load('Lora', ['Lora.ttf']);
  await load('Cinzel', ['Cinzel.ttf']);
  await load('Inter', ['Inter.ttf']);
}

Future<AppState> makeState({bool onboarded = true, bool withData = true, double? heading}) async {
  SharedPreferences.setMockInitialValues({});
  final store = await AppStore.open();
  // read the file directly: asset loading never completes inside the test harness's fake clock
  final content = Content.fromJson(jsonDecode(File('assets/data/content.json').readAsStringSync()) as Map<String, dynamic>);
  if (onboarded) {
    store.settings
      ..onboarded = true
      ..placeName = 'Melbourne'
      ..lat = -37.8136
      ..lng = 144.9631;
  }
  final now = DateTime(2026, 11, 18, 14, 30);
  if (withData) {
    // a few days of history, so the screens are not empty
    for (var i = 1; i <= 9; i++) {
      final d = DateTime(2026, 11, 18 - i);
      final l = store.logFor(d);
      for (final p in ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        if (i == 4 && p == 'fajr') continue;
        l.prayers[p] = i.isEven ? 3 : 7;
      }
    }
    final t = store.logFor(DateTime(2026, 11, 18));
    t.prayers['fajr'] = 7 | 8 | 16;
    t.prayers['dhuhr'] = 3;
    t.done.addAll(['adhkar_am', 'quran', 'duha', 'istighfar']);
    t.water = 3;
    t.hearts = 4;
    t.priorities = ['Finish the report', 'Call my mother', ''];
    for (final i in [0, 1, 2, 3, 4, 5, 6]) {
      store.names[i] = NameProgress(i < 4 ? 5 : 2, '2026-11-18');
    }
    store.juz.addAll([1, 2, 3, 4, 5, 6, 7]);
    store.khatmahs = 1;
    store.duas.add(DuaItem('Ease for my family', '2026-11-01'));
    store.duas.add(DuaItem('A good job', '2026-10-01', answered: true));
  }
  return AppState(store, content, Reminders(), fixedNow: now, headings: Stream.value(heading))..selected = DateTime(2026, 11, 18);
}

