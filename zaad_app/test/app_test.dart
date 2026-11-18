import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad/app_state.dart';
import 'package:zaad/data/content.dart';
import 'package:zaad/data/store.dart';
import 'package:zaad/logic/plan.dart';
import 'package:zaad/logic/reminders.dart';
import 'package:zaad/main.dart';
import 'support.dart';

Content loadContent() => Content.fromJson(jsonDecode(File('assets/data/content.json').readAsStringSync()) as Map<String, dynamic>);

Future<AppState> setup({DateTime? now}) async {
  SharedPreferences.setMockInitialValues({});
  final store = await AppStore.open();
  store.settings
    ..onboarded = true
    ..placeName = 'Melbourne'
    ..lat = -37.8136
    ..lng = 144.9631;
  final n = now ?? DateTime(2026, 11, 18, 14, 30);
  return AppState(store, loadContent(), Reminders(), fixedNow: n, headings: Stream.value(null))..selected = dayOnly(n);
}

void main() {
  setUpAll(loadFonts);

  test('the content file has what the app needs', () {
    final c = loadContent();
    expect(c.names.length, 99);
    expect(c.names.every((n) => n.arabic.isNotEmpty && n.live.isNotEmpty), isTrue);
    expect(c.sunnah.length, 53);
    expect(c.weekly.isNotEmpty, isTrue);
    for (final k in c.rotation) {
      final h = c.hadith[k]!;
      expect(h.arabic, isNotEmpty, reason: k);
      expect(h.narrator, isNotEmpty, reason: k);
    }
    // every task that points at a hadith finds it
    for (final t in baseTasks) {
      if (t.hadith != null) expect(c.hadith.containsKey(t.hadith), isTrue, reason: t.id);
    }
    for (var d = DateTime(2027, 1, 1); d.year == 2027; d = addDays(d, 1)) {
      for (final t in dayInfo(d).tasks) {
        if (t.hadith != null) expect(c.hadith.containsKey(t.hadith), isTrue, reason: '${dateKey(d)} ${t.id}');
      }
      hadithOfDay(d, dayInfo(d), c);
      hadithOfWeek(d, c);
      sunnahOfWeek(d, c);
    }
  });

  test('ticking prayers: on time and in jama\'ah mean prayed; un-ticking prayed clears them', () {
    final l = DayLog();
    l.toggle('fajr', bitOnTime);
    expect(l.has('fajr', bitFard), isTrue);
    l.toggle('fajr', bitJamaah);
    l.toggle('fajr', bitFard); // un-tick prayed
    expect(l.prayers.containsKey('fajr'), isFalse);
    l.toggle('dhuhr', bitSunnah);
    expect(l.has('dhuhr', bitFard), isFalse); // the sunnah alone does not count as the prayer
  });

  test('streak counts all-five days back from today, or from yesterday while today is unfinished', () async {
    final s = await setup();
    final today = DateTime(2026, 11, 18);
    for (var i = 1; i <= 3; i++) {
      final l = s.store.logFor(addDays(today, -i));
      for (final p in prayers) {
        l.prayers[p.id] = bitFard;
      }
    }
    expect(s.store.streak(today), 3);
    for (final p in prayers) {
      s.store.logFor(today).prayers[p.id] = bitFard;
    }
    expect(s.store.streak(today), 4);
  });

  test('spaced repetition: knowing a name moves it up a box, missing it sends it back', () async {
    final s = await setup();
    final today = DateTime(2026, 11, 18);
    s.store.startName(5, today);
    expect(s.store.dueNames(today), [5]);
    s.store.answerName(5, true, today);
    expect(s.store.boxOf(5), 2);
    expect(s.store.dueNames(today), isEmpty);
    expect(s.store.dueNames(addDays(today, 2)), [5]);
    s.store.answerName(5, false, addDays(today, 2));
    expect(s.store.boxOf(5), 1);
    for (var i = 0; i < 5; i++) {
      s.store.answerName(5, true, today);
    }
    expect(s.store.isMemorised(5), isTrue);
  });

  test('a backup restores everything, and a bad backup is refused', () async {
    final a = await setup();
    a.store.logFor(DateTime(2026, 11, 18)).toggle('fajr', bitOnTime);
    a.store.logFor(DateTime(2026, 11, 18)).priorities[0] = 'Call my mother';
    a.store.startName(3, DateTime(2026, 11, 18));
    a.store.juz.addAll([1, 2]);
    a.store.duas.add(DuaItem('Ease', '2026-11-18'));
    final backup = a.store.exportJson();
    final b = await setup();
    expect(b.store.importJson('not json'), isFalse);
    expect(b.store.importJson('{"v": 2}'), isFalse);
    expect(b.store.importJson(backup), isTrue);
    expect(b.store.peek(DateTime(2026, 11, 18))!.has('fajr', bitOnTime), isTrue);
    expect(b.store.peek(DateTime(2026, 11, 18))!.priorities[0], 'Call my mother');
    expect(b.store.boxOf(3), 1);
    expect(b.store.juz, {1, 2});
    expect(b.store.duas.single.text, 'Ease');
  });

  testWidgets('tapping a prayer chip and a task saves them', (t) async {
    final s = await setup();
    t.view.devicePixelRatio = 2;
    t.view.physicalSize = const Size(780, 4800);
    addTearDown(t.view.resetPhysicalSize);
    await t.pumpWidget(ZaadApp(state: s));
    await t.pump();
    // 'Dhuhr' is the window that is open at 14:30
    await t.tap(find.text('Prayed').first);
    await t.pump();
    expect(s.store.peek(DateTime(2026, 11, 18))!.has('dhuhr', bitFard), isTrue);
    await t.tap(find.text('On time').first);
    await t.pump();
    expect(s.store.peek(DateTime(2026, 11, 18))!.has('dhuhr', bitOnTime), isTrue);
    await t.tap(find.text('Sadaqah or a kind act'));
    await t.pump();
    expect(s.store.peek(DateTime(2026, 11, 18))!.done, contains('sadaqah'));
    // the next day button moves to Thursday
    await t.tap(find.byTooltip('Next day'));
    await t.pump();
    expect(find.text('THURSDAY'), findsOneWidget);
    expect(s.selected, DateTime(2026, 11, 19));
    await t.pump(const Duration(seconds: 2)); // let the delayed save finish
  });

  testWidgets('the hadith behind a task opens', (t) async {
    final s = await setup();
    t.view.devicePixelRatio = 2;
    t.view.physicalSize = const Size(780, 4800);
    addTearDown(t.view.resetPhysicalSize);
    await t.pumpWidget(ZaadApp(state: s));
    await t.pump();
    await t.tap(find.byTooltip('The hadith behind this').first);
    await t.pumpAndSettle();
    // the sheet shows the source line of the hadith
    final shown = find.byWidgetPredicate((w) => w is Text && (w.data ?? '').contains('·') && RegExp(r'BUKHARI|MUSLIM|TIRMIDHI|DAWUD|NASA').hasMatch((w.data ?? '').toUpperCase()));
    expect(shown, findsWidgets);
  });

  testWidgets('onboarding needs a place before it lets you begin', (t) async {
    SharedPreferences.setMockInitialValues({});
    final store = await AppStore.open();
    final s = AppState(store, loadContent(), Reminders(), fixedNow: DateTime(2026, 11, 18, 14, 30));
    t.view.devicePixelRatio = 2;
    t.view.physicalSize = const Size(780, 1700);
    addTearDown(t.view.resetPhysicalSize);
    await t.pumpWidget(ZaadApp(state: s));
    await t.pump();
    expect(find.text('Choose where you are to begin'), findsOneWidget);
    s.settings
      ..placeName = 'Melbourne'
      ..lat = -37.8
      ..lng = 145.0;
    s.store.save();
    await t.pump();
    expect(find.text('Begin'), findsOneWidget);
    await t.pump(const Duration(seconds: 2));
  });

  testWidgets('the dial and window cards follow the time of day', (t) async {
    for (final (hour, window) in [(3, 'Before Fajr'), (5, 'Fajr'), (9, 'Duha'), (14, 'Dhuhr'), (17, "'Asr"), (21, 'Maghrib'), (22, "'Isha")]) {
      final s = await setup(now: DateTime(2026, 11, 18, hour, 0));
      final times = s.timesOn(DateTime(2026, 11, 18))!;
      final w = times.windowAt(s.now);
      expect(windowsInOrder.firstWhere((x) => x.id == w).name, window, reason: 'at $hour:00');
    }
  });
}
