import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad/app_state.dart';
import 'package:zaad/data/content.dart';
import 'package:zaad/data/store.dart';
import 'package:zaad/logic/plan.dart';
import 'package:zaad/logic/hisnul.dart';
import 'package:zaad/logic/reminders.dart';
import 'package:zaad/main.dart';
import 'support.dart';

Content loadContent() => Content.fromJson(jsonDecode(File('assets/data/content.json').readAsStringSync()) as Map<String, dynamic>);

Future<AppState> setup({DateTime? now, List<int>? hisnul}) async {
  SharedPreferences.setMockInitialValues({});
  final store = await AppStore.open();
  store.settings
    ..onboarded = true
    ..placeName = 'Melbourne'
    ..lat = -37.8136
    ..lng = 144.9631;
  final n = now ?? DateTime(2026, 11, 18, 14, 30);
  return AppState(store, loadContent(), Reminders(),
      fixedNow: n, headings: Stream.value(null), hisnul: hisnul == null ? openHisnul : (c) async => hisnul.add(c))
    ..selected = dayOnly(n);
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
    a.store.settings.quranPerDay = 7;
    a.store.setQuranPosition(100);
    a.store.logFor(DateTime(2026, 11, 18)).quranPages = 7;
    a.store.duas.add(DuaItem('Ease', '2026-11-18'));
    final backup = a.store.exportJson();
    final b = await setup();
    expect(b.store.importJson('not json'), isFalse);
    expect(b.store.importJson('{"v": 2}'), isFalse);
    expect(b.store.importJson(backup), isTrue);
    expect(b.store.peek(DateTime(2026, 11, 18))!.has('fajr', bitOnTime), isTrue);
    expect(b.store.peek(DateTime(2026, 11, 18))!.priorities[0], 'Call my mother');
    expect(b.store.boxOf(3), 1);
    expect(b.store.settings.quranPerDay, 7);
    expect(b.store.quran.pagesByDate['2026-11-18'], 7);
    expect(b.store.quran.nextPage, a.store.quran.nextPage);
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

  group('morning and evening adhkar send you to Hisnul Muslim', () {
    Future<void> show(WidgetTester t, AppState s) async {
      t.view.devicePixelRatio = 2;
      t.view.physicalSize = const Size(780, 4800);
      addTearDown(t.view.resetPhysicalSize);
      await t.pumpWidget(ZaadApp(state: s));
      await t.pump();
    }

    testWidgets('morning: a reminder appears until you read, opens chapter 27, and goes when ticked', (t) async {
      final calls = <int>[];
      final s = await setup(now: DateTime(2026, 11, 18, 9, 0), hisnul: calls);
      await show(t, s);
      expect(find.byKey(const ValueKey('nudge-morning')), findsOneWidget);
      expect(find.byKey(const ValueKey('nudge-evening')), findsNothing);
      await t.tap(find.descendant(of: find.byKey(const ValueKey('nudge-morning')), matching: find.text('Read in Hisnul Muslim')));
      await t.pump();
      expect(calls, [hisnulMorning]);
      await t.tap(find.descendant(of: find.byKey(const ValueKey('nudge-morning')), matching: find.text('I read them')));
      await t.pump();
      expect(find.byKey(const ValueKey('nudge-morning')), findsNothing);
      expect(s.store.peek(DateTime(2026, 11, 18))!.done, contains('adhkar_am'));
      await t.pump(const Duration(seconds: 2));
    });

    testWidgets('evening: appears after Asr, opens the evening chapter', (t) async {
      final calls = <int>[];
      final s = await setup(now: DateTime(2026, 11, 18, 17, 30), hisnul: calls);
      await show(t, s);
      // morning is still not read at this hour, so that one shows too, until the evening begins
      expect(find.byKey(const ValueKey('nudge-evening')), findsOneWidget);
      expect(find.byKey(const ValueKey('nudge-morning')), findsNothing);
      await t.tap(find.descendant(of: find.byKey(const ValueKey('nudge-evening')), matching: find.text('Read in Hisnul Muslim')));
      await t.pump();
      expect(calls, [hisnulEvening]);
    });

    testWidgets('no reminder before Fajr, when already read, or on another day', (t) async {
      final s = await setup(now: DateTime(2026, 11, 18, 3, 0));
      await show(t, s);
      expect(find.byKey(const ValueKey('nudge-morning')), findsNothing);
      final s2 = await setup(now: DateTime(2026, 11, 18, 9, 0));
      s2.store.logFor(DateTime(2026, 11, 18)).done.add('adhkar_am');
      await show(t, s2);
      expect(find.byKey(const ValueKey('nudge-morning')), findsNothing);
      final s3 = await setup(now: DateTime(2026, 11, 18, 9, 0));
      s3.selectDay(DateTime(2026, 11, 17));
      await show(t, s3);
      expect(find.byKey(const ValueKey('nudge-morning')), findsNothing);
    });

    testWidgets('the adhkar tasks have their own button that opens Hisnul Muslim', (t) async {
      final calls = <int>[];
      final s = await setup(now: DateTime(2026, 11, 18, 5, 0), hisnul: calls); // the Fajr window is open
      await show(t, s);
      await t.tap(find.byTooltip('Read in Hisnul Muslim').first);
      await t.pump();
      expect(calls, [hisnulMorning]);
    });
  });

  group("the Qur'an card at the start of Today", () {
    Future<void> show(WidgetTester t, AppState s) async {
      t.view.devicePixelRatio = 2;
      t.view.physicalSize = const Size(780, 4800);
      addTearDown(t.view.resetPhysicalSize);
      await t.pumpWidget(ZaadApp(state: s));
      await t.pump();
    }

    testWidgets('shows first until a goal is set', (t) async {
      final s = await setup();
      await show(t, s);
      expect(find.byKey(const ValueKey('quran-start')), findsOneWidget);
      expect(find.text("Set my daily Qur'an"), findsOneWidget);
      s.settings.quranPerDay = 5;
      s.store.save();
      await t.pump();
      expect(find.byKey(const ValueKey('quran-start')), findsNothing);
      await t.pump(const Duration(seconds: 2));
    });

    testWidgets('"Not now" hides it and the choice is kept', (t) async {
      final s = await setup();
      await show(t, s);
      await t.tap(find.text('Not now'));
      await t.pump();
      expect(find.byKey(const ValueKey('quran-start')), findsNothing);
      expect(s.settings.quranPromptHidden, isTrue);
      await t.pump(const Duration(seconds: 2));
    });
  });

  group("the daily Qur'an goal", () {
    Future<void> show(WidgetTester t, AppState s) async {
      t.view.devicePixelRatio = 2;
      t.view.physicalSize = const Size(780, 4800);
      addTearDown(t.view.resetPhysicalSize);
      await t.pumpWidget(ZaadApp(state: s));
      await t.pump();
    }

    testWidgets('choose a goal from the sheet, then the day shows the pages and ticking moves on', (t) async {
      final s = await setup();
      await show(t, s);
      expect(find.text('Set my goal'), findsOneWidget);
      await t.tap(find.text('Set my goal'));
      await t.pumpAndSettle();
      await t.tap(find.textContaining('30 days'));
      await t.pump();
      expect(find.textContaining('finish in 29 days'), findsOneWidget);
      await t.tap(find.text('Save my goal'));
      await t.pumpAndSettle();
      expect(s.settings.quranPerDay, 21);
      expect(find.text("Qur'an: pages 1 to 21"), findsOneWidget);
      await t.tap(find.text("Qur'an: pages 1 to 21"));
      await t.pump();
      expect(s.store.peek(DateTime(2026, 11, 18))!.quranPages, 21);
      await t.tap(find.byTooltip('Next day'));
      await t.pump();
      expect(find.text("Qur'an: pages 22 to 42"), findsOneWidget);
      await t.pump(const Duration(seconds: 2));
    });
  });
}
