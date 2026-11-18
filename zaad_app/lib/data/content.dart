import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

class NameOfAllah {
  const NameOfAllah(this.index, this.transliteration, this.arabic, this.meaning, this.live);
  final int index;
  final String transliteration, arabic, meaning, live;
}

class Hadith {
  const Hadith({required this.key, required this.label, required this.arabic, required this.english, required this.ref, required this.narrator});
  final String key, label, arabic, english, ref, narrator;
  String get source => narrator.isEmpty ? ref : '$narrator · $ref';
}

class WeeklyHadith {
  const WeeklyHadith({required this.title, required this.hadith, required this.action, required this.seasonal});
  final String title, action;
  final Hadith hadith;
  final bool seasonal;
}

class Sunnah {
  const Sunnah(this.text, this.ref);
  final String text, ref;
}

class MonthTheme {
  const MonthTheme(this.theme, this.ayah, this.ref);
  final String theme, ayah, ref;
}

/// Everything the app reads from assets/data/content.json (written by the planner's build script).
class Content {
  Content._(this.names, this.hadith, this.rotation, this.weekly, this.sunnah, this.months, this.namesHadith);

  final List<NameOfAllah> names;
  final Map<String, Hadith> hadith;
  final List<String> rotation;
  final List<WeeklyHadith> weekly;
  final List<Sunnah> sunnah;
  final List<MonthTheme> months;
  final Hadith namesHadith;

  static Future<Content> load() async => Content.fromJson(jsonDecode(await rootBundle.loadString('assets/data/content.json')) as Map<String, dynamic>);

  factory Content.fromJson(Map<String, dynamic> j) {
    Hadith h(String key, Map<String, dynamic> m) => Hadith(
        key: key,
        label: (m['label'] ?? m['title'] ?? '') as String,
        arabic: (m['ar'] ?? '') as String,
        english: (m['en'] ?? '') as String,
        ref: (m['ref'] ?? '') as String,
        narrator: (m['narrator'] ?? '') as String);
    final names = <NameOfAllah>[];
    for (final e in (j['names'] as List).asMap().entries) {
      final m = e.value as Map<String, dynamic>;
      names.add(NameOfAllah(e.key, m['t'] as String, m['a'] as String, m['m'] as String, m['l'] as String));
    }
    final hadith = <String, Hadith>{
      for (final e in (j['hadith'] as Map<String, dynamic>).entries) e.key: h(e.key, e.value as Map<String, dynamic>),
    };
    final weekly = [
      for (final w in j['weekly'] as List)
        WeeklyHadith(
          title: (w as Map<String, dynamic>)['title'] as String,
          hadith: h(w['title'] as String, w),
          action: w['action'] as String,
          seasonal: w['seasonal'] as bool,
        ),
    ];
    return Content._(
      names,
      hadith,
      [for (final k in j['rotation'] as List) k as String],
      weekly,
      [for (final s in j['sunnah'] as List) Sunnah((s as Map<String, dynamic>)['t'] as String, s['ref'] as String)],
      [for (final m in j['months'] as List) MonthTheme((m as Map<String, dynamic>)['theme'] as String, m['ayah'] as String, m['ref'] as String)],
      h('names99', j['namesHadith'] as Map<String, dynamic>),
    );
  }
}
