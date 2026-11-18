import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:zaad/logic/plan.dart';
import 'package:zaad/logic/prayer.dart';

void main() {
  final fx = jsonDecode(File('test/fixtures/planner_2027.json').readAsStringSync()) as Map<String, dynamic>;
  final hj = jsonDecode(File('test/fixtures/hijri_umalqura.json').readAsStringSync()) as Map<String, dynamic>;

  test('Hijri dates match the printed planner (Umm al-Qura), 2026 to 2028', () {
    var bad = 0;
    hj.forEach((k, v) {
      final h = hijriOf(DateTime.parse(k));
      if (h.year != v[0] || h.month != v[1] || h.day != v[2]) bad++;
    });
    expect(bad, 0);
  });

  test('week numbers and the name of Allah for each day match the planner for all of 2027', () {
    final wrong = <String>[];
    fx.forEach((k, v) {
      final d = DateTime.parse(k);
      if (weekOf(d).number != v['week'] || nameIndexFor(d, 99) != v['name']) wrong.add(k);
    });
    expect(wrong, isEmpty);
  });

  test('special days (Ramadan, Eids, white days, Fridays, fasts) match the planner for all of 2027', () {
    final wrong = <String>[];
    fx.forEach((k, v) {
      final info = dayInfo(DateTime.parse(k));
      final badges = info.badges.where((b) => !b.startsWith('Tonight')).toList();
      final expected = (v['badges'] as List).cast<String>();
      final hasFast = info.tasks.any((t) => t.id == 'fast');
      if (badges.join('|') != expected.join('|') || hasFast != v['fast']) wrong.add('$k $badges vs $expected fast=$hasFast/${v['fast']}');
    });
    expect(wrong, isEmpty, reason: wrong.take(5).join('\n'));
  });

  test('the first ten names go to the first five weeks', () {
    expect(namesOfWeek(1, 99), [0, 1]);
    expect(namesOfWeek(49, 99), [96, 97]);
    expect(namesOfWeek(50, 99), [98]);
    expect(namesOfWeek(51, 99), isEmpty);
  });

  test('prayer times for Melbourne are in order, on the right day and about where they should be', () {
    // Run with TZ=Australia/Melbourne so local time is the phone's time there.
    const melbourne = Place('Melbourne', -37.8136, 144.9631);
    final t = timesFor(DateTime(2026, 11, 18), melbourne, 'muslimWorldLeague', false);
    final order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha];
    for (var i = 1; i < order.length; i++) {
      expect(order[i].isAfter(order[i - 1]), isTrue);
    }
    for (final x in order) {
      expect(dateKey(x), '2026-11-18');
    }
    expect(t.dhuhr.hour, inInclusiveRange(12, 13));
    expect(t.sunrise.hour, inInclusiveRange(5, 6));
    expect(t.maghrib.hour, inInclusiveRange(19, 20));
    expect(t.lastThird.isBefore(t.fajr), isTrue);
    expect(t.lastThird.isAfter(DateTime(2026, 11, 17, 22)), isTrue);
  }, skip: DateTime.now().timeZoneName.contains('AEDT') || DateTime.now().timeZoneName.contains('AEST') ? false : 'needs TZ=Australia/Melbourne');

  test('the Qibla from Melbourne is north-west and from London is south-east', () {
    final m = qiblaFrom(const Place('Melbourne', -37.8136, 144.9631));
    final l = qiblaFrom(const Place('London', 51.5074, -0.1278));
    expect(m, inInclusiveRange(270, 300));
    expect(l, inInclusiveRange(110, 130));
  });
}
