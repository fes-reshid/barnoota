import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../logic/plan.dart';
import '../logic/prayer.dart';

class Settings {
  double? lat, lng;
  String placeName = '';
  String method = 'muslimWorldLeague';
  bool hanafi = false;
  bool remindPrayer = false;
  bool remindBefore = false;
  bool remindAdhkar = false;
  bool onboarded = false;

  Place? get place => lat == null || lng == null ? null : Place(placeName.isEmpty ? 'My location' : placeName, lat!, lng!);

  Map<String, dynamic> toJson() => {
        'lat': lat, 'lng': lng, 'place': placeName, 'method': method, 'hanafi': hanafi,
        'rp': remindPrayer, 'rb': remindBefore, 'ra': remindAdhkar, 'ob': onboarded,
      };

  void load(Map<String, dynamic> j) {
    lat = (j['lat'] as num?)?.toDouble();
    lng = (j['lng'] as num?)?.toDouble();
    placeName = (j['place'] ?? '') as String;
    method = (j['method'] ?? 'muslimWorldLeague') as String;
    hanafi = (j['hanafi'] ?? false) as bool;
    remindPrayer = (j['rp'] ?? false) as bool;
    remindBefore = (j['rb'] ?? false) as bool;
    remindAdhkar = (j['ra'] ?? false) as bool;
    onboarded = (j['ob'] ?? false) as bool;
  }
}

/// Everything the user records for one day.
class DayLog {
  DayLog();
  final Map<String, int> prayers = {};
  final Set<String> done = {};
  List<String> priorities = ['', '', ''];
  List<String> gratitude = ['', '', ''];
  String bestDeed = '', forgive = '', tomorrow = '';
  int water = 0, hearts = 0;

  bool has(String prayer, int bit) => ((prayers[prayer] ?? 0) & bit) != 0;
  void toggle(String prayer, int bit) {
    var v = prayers[prayer] ?? 0;
    final on = (v & bit) == 0; // is this tap switching the chip on?
    v = on ? v | bit : v & ~bit;
    if (bit == bitFard && !on) {
      v &= ~(bitOnTime | bitJamaah); // un-ticking "prayed" clears the two that depend on it
    } else if (on && (bit == bitOnTime || bit == bitJamaah)) {
      v |= bitFard; // on time and in jama'ah both mean the prayer was prayed
    }
    if (v == 0) {
      prayers.remove(prayer);
    } else {
      prayers[prayer] = v;
    }
  }

  int get prayedCount => prayers.values.where((v) => (v & bitFard) != 0).length;
  int get onTimeCount => prayers.values.where((v) => (v & bitOnTime) != 0).length;
  bool get isEmpty =>
      prayers.isEmpty && done.isEmpty && priorities.every((s) => s.isEmpty) && gratitude.every((s) => s.isEmpty) &&
      bestDeed.isEmpty && forgive.isEmpty && tomorrow.isEmpty && water == 0 && hearts == 0;

  Map<String, dynamic> toJson() => {
        'p': prayers, 'd': done.toList(), 'pr': priorities, 'g': gratitude,
        'b': bestDeed, 'f': forgive, 't': tomorrow, 'w': water, 'h': hearts,
      };

  factory DayLog.fromJson(Map<String, dynamic> j) {
    final l = DayLog();
    ((j['p'] ?? {}) as Map<String, dynamic>).forEach((k, v) => l.prayers[k] = v as int);
    l.done.addAll(((j['d'] ?? []) as List).cast<String>());
    List<String> three(Object? o) {
      final x = ((o ?? []) as List).cast<String>();
      return [for (var i = 0; i < 3; i++) i < x.length ? x[i] : ''];
    }
    l.priorities = three(j['pr']);
    l.gratitude = three(j['g']);
    l.bestDeed = (j['b'] ?? '') as String;
    l.forgive = (j['f'] ?? '') as String;
    l.tomorrow = (j['t'] ?? '') as String;
    l.water = (j['w'] ?? 0) as int;
    l.hearts = (j['h'] ?? 0) as int;
    return l;
  }
}

/// Spaced repetition for the names: a box from 0 (new) to 5 (memorised), and the day a name is next due.
class NameProgress {
  NameProgress(this.box, this.due);
  int box;
  String due;
}

const reviewGaps = [0, 1, 2, 4, 8, 16]; // days until the next review for each box

class DuaItem {
  DuaItem(this.text, this.since, {this.answered = false});
  String text, since;
  bool answered;
}

/// The app's saved state. Everything stays on the phone.
class AppStore extends ChangeNotifier {
  AppStore._(this._prefs);
  final SharedPreferences _prefs;
  static const _key = 'zaad.v1';

  final settings = Settings();
  final Map<String, DayLog> logs = {};
  final Map<int, NameProgress> names = {};
  final Set<int> juz = {};
  int khatmahs = 0;
  final List<DuaItem> duas = [];
  Timer? _timer;

  static Future<AppStore> open() async {
    final s = AppStore._(await SharedPreferences.getInstance());
    final raw = s._prefs.getString(_key);
    if (raw != null) {
      try {
        s._load(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {
        // a damaged save is ignored rather than stopping the app
      }
    }
    return s;
  }

  void _load(Map<String, dynamic> j) {
    settings.load((j['settings'] ?? {}) as Map<String, dynamic>);
    ((j['logs'] ?? {}) as Map<String, dynamic>).forEach((k, v) => logs[k] = DayLog.fromJson(v as Map<String, dynamic>));
    ((j['names'] ?? {}) as Map<String, dynamic>).forEach((k, v) {
      final m = v as Map<String, dynamic>;
      names[int.parse(k)] = NameProgress(m['b'] as int, m['d'] as String);
    });
    juz.addAll(((j['juz'] ?? []) as List).cast<int>());
    khatmahs = (j['khatmahs'] ?? 0) as int;
    for (final d in (j['duas'] ?? []) as List) {
      final m = d as Map<String, dynamic>;
      duas.add(DuaItem(m['t'] as String, m['s'] as String, answered: (m['a'] ?? false) as bool));
    }
  }

  Map<String, dynamic> toJson() => {
        'v': 1,
        'settings': settings.toJson(),
        'logs': {for (final e in logs.entries) if (!e.value.isEmpty) e.key: e.value.toJson()},
        'names': {for (final e in names.entries) '${e.key}': {'b': e.value.box, 'd': e.value.due}},
        'juz': juz.toList(),
        'khatmahs': khatmahs,
        'duas': [for (final d in duas) {'t': d.text, 's': d.since, 'a': d.answered}],
      };

  /// A backup the user can keep or move to another phone.
  String exportJson() => const JsonEncoder.withIndent(' ').convert(toJson());

  bool importJson(String text) {
    try {
      final j = jsonDecode(text) as Map<String, dynamic>;
      if (j['v'] != 1) return false;
      logs.clear();
      names.clear();
      juz.clear();
      duas.clear();
      _load(j);
      save();
      return true;
    } catch (_) {
      return false;
    }
  }

  DayLog logFor(DateTime d) => logs.putIfAbsent(dateKey(d), DayLog.new);
  DayLog? peek(DateTime d) => logs[dateKey(d)];

  /// Save (soon) and tell the screens.
  void save() {
    notifyListeners();
    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 400), () => _prefs.setString(_key, jsonEncode(toJson())));
  }

  /// Save (soon) without redrawing, for text being typed.
  void saveQuiet() {
    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 600), () => _prefs.setString(_key, jsonEncode(toJson())));
  }

  Future<void> flush() async {
    _timer?.cancel();
    await _prefs.setString(_key, jsonEncode(toJson()));
  }

  // -- names ---------------------------------------------------------------
  int boxOf(int i) => names[i]?.box ?? 0;
  bool isMemorised(int i) => boxOf(i) >= 5;
  int get memorisedCount => [for (var i = 0; i < 99; i++) if (isMemorised(i)) i].length;

  /// Names due for review today (started but not memorised), oldest first.
  List<int> dueNames(DateTime today) {
    final k = dateKey(today);
    final due = [for (final e in names.entries) if (e.value.box < 5 && e.value.due.compareTo(k) <= 0) e.key]..sort();
    return due;
  }

  /// Answer a flashcard: knowing it moves it up a box, missing it sends it back to box 1.
  void answerName(int i, bool knew, DateTime today) {
    final p = names.putIfAbsent(i, () => NameProgress(0, dateKey(today)));
    p.box = knew ? (p.box + 1).clamp(1, 5) : 1;
    p.due = dateKey(addDays(today, reviewGaps[p.box]));
    save();
  }

  void startName(int i, DateTime today) {
    names.putIfAbsent(i, () => NameProgress(1, dateKey(today)));
    save();
  }

  void setMemorised(int i, bool on, DateTime today) {
    if (on) {
      names[i] = NameProgress(5, dateKey(addDays(today, 30)));
    } else {
      names[i] = NameProgress(1, dateKey(today));
    }
    save();
  }

  // -- statistics ----------------------------------------------------------
  /// Days in a row, counting back from today (or yesterday if today is not done yet), with all five prayers prayed.
  int streak(DateTime today) {
    var d = dayOnly(today);
    if ((peek(d)?.prayedCount ?? 0) < 5) d = addDays(d, -1);
    var n = 0;
    while ((peek(d)?.prayedCount ?? 0) >= 5) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }
}
