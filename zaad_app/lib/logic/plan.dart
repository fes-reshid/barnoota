import 'package:hijri/hijri_calendar.dart';
import 'package:material_ui/material_ui.dart';

import '../core/theme.dart';
import '../data/content.dart';

String two(int n) => n.toString().padLeft(2, '0');
String dateKey(DateTime d) => '${d.year}-${two(d.month)}-${two(d.day)}';
DateTime dayOnly(DateTime d) => DateTime(d.year, d.month, d.day);
DateTime addDays(DateTime d, int n) => DateTime(d.year, d.month, d.day + n);
int daysBetween(DateTime a, DateTime b) => DateTime.utc(b.year, b.month, b.day).difference(DateTime.utc(a.year, a.month, a.day)).inDays;
int yearDay(DateTime d) => daysBetween(DateTime(d.year, 1, 1), d) + 1;

const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdayAr = ['الإِثْنَيْن', 'الثُّلَاثَاء', 'الأَرْبِعَاء', 'الخَمِيس', 'الجُمُعَة', 'السَّبْت', 'الأَحَد'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const hijriMonths = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir", 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul-Qa'dah", 'Dhul-Hijjah'
];
const hijriMonthsAr = [
  'مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الآخِر', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة',
  'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'
];
String arabicDigits(int n) => n.toString().split('').map((c) => '٠١٢٣٤٥٦٧٨٩'[int.parse(c)]).join();

class HijriDate {
  const HijriDate(this.year, this.month, this.day);
  final int year, month, day;
  String get monthName => hijriMonths[month - 1];
  String get text => '$day $monthName $year';
  String get arabic => '${arabicDigits(day)} ${hijriMonthsAr[month - 1]} ${arabicDigits(year)}';
}

HijriDate hijriOf(DateTime d) {
  final h = HijriCalendar.fromDate(d);
  return HijriDate(h.hYear, h.hMonth, h.hDay);
}

/// Weeks run Monday to Sunday; week 1 starts on 1 January, like the printed planner.
class WeekInfo {
  const WeekInfo(this.number, this.start, this.length);
  final int number, length;
  final DateTime start;
}

WeekInfo weekOf(DateTime d) {
  final jan1 = DateTime(d.year, 1, 1);
  final mon0 = addDays(jan1, -(jan1.weekday - 1));
  final n = daysBetween(mon0, d) ~/ 7 + 1;
  final start = addDays(mon0, 7 * (n - 1));
  final first = start.isBefore(jan1) ? jan1 : start;
  var end = addDays(mon0, 7 * n - 1);
  final dec31 = DateTime(d.year, 12, 31);
  if (end.isAfter(dec31)) end = dec31;
  return WeekInfo(n, first, daysBetween(first, end) + 1);
}

/// The name of Allah for a day: two a week, so the year covers all ninety-nine; the last weeks revise them.
int nameIndexFor(DateTime d, int count) {
  final w = weekOf(d);
  final first = 2 * w.number - 2;
  if (first >= count) return (yearDay(d) * 5) % count;
  final hasSecond = first + 1 < count;
  final pos = daysBetween(w.start, d);
  return first + ((pos < (w.length + 1) ~/ 2 || !hasSecond) ? 0 : 1);
}

/// The names to memorise in a week (one or two; none in the revision weeks).
List<int> namesOfWeek(int weekNumber, int count) => [for (var i = 2 * weekNumber - 2; i < 2 * weekNumber && i < count; i++) i];

// ---------------------------------------------------------------------------
// Windows of the day, built on the five prayers
// ---------------------------------------------------------------------------
class WindowDef {
  const WindowDef(this.id, this.name, this.arabic, this.icon, this.color);
  final String id, name, arabic;
  final IconData icon;
  final Color color;
}

const wNight = WindowDef('night', 'Before Fajr', 'قِيَامُ اللَّيْل', Icons.bedtime_outlined, Zc.night);
const wFajr = WindowDef('fajr', 'Fajr', 'الفَجْر', Icons.wb_twilight, Zc.fajr);
const wDuha = WindowDef('duha', 'Duha', 'الضُّحَى', Icons.wb_sunny_outlined, Zc.duha);
const wDhuhr = WindowDef('dhuhr', 'Dhuhr', 'الظُّهْر', Icons.light_mode, Zc.dhuhr);
const wAsr = WindowDef('asr', "'Asr", 'العَصْر', Icons.wb_cloudy_outlined, Zc.asr);
const wMaghrib = WindowDef('maghrib', 'Maghrib', 'المَغْرِب', Icons.nights_stay_outlined, Zc.maghrib);
const wIsha = WindowDef('isha', "'Isha", 'العِشَاء', Icons.dark_mode_outlined, Zc.isha);
const wAny = WindowDef('any', 'Through the day', 'طُولَ اليَوْم', Icons.all_inclusive, Zc.green);
const windowsInOrder = [wNight, wFajr, wDuha, wDhuhr, wAsr, wMaghrib, wIsha];

/// The five fard prayers: each belongs to a window, with its sunnah rak'ahs.
class PrayerDef {
  const PrayerDef(this.id, this.name, this.window, this.sunnah);
  final String id, name, sunnah;
  final WindowDef window;
}

const prayers = [
  PrayerDef('fajr', 'Fajr', wFajr, '2 before'),
  PrayerDef('dhuhr', 'Dhuhr', wDhuhr, '4 before, 2 after'),
  PrayerDef('asr', "'Asr", wAsr, ''),
  PrayerDef('maghrib', 'Maghrib', wMaghrib, '2 after'),
  PrayerDef('isha', "'Isha", wIsha, '2 after'),
];

/// Bits stored for each prayer.
const bitFard = 1, bitOnTime = 2, bitJamaah = 4, bitSunnah = 8, bitDhikr = 16;

class Task {
  const Task(this.id, this.label, this.window, {this.hadith, this.special = false});
  final String id, label;
  final WindowDef window;
  final String? hadith;
  final bool special;
}

/// What is special about a date, from its Hijri date and weekday.
class DayInfo {
  DayInfo(this.hijri, this.weekday);
  final HijriDate hijri;
  final int weekday; // Monday = 1
  final badges = <String>[];
  final tasks = <Task>[];
  String? hadithKey; // the hadith to show for the day, if the day has its own
  bool get isFriday => weekday == 5;
  bool get isRamadan => hijri.month == 9;
}

DayInfo dayInfo(DateTime d) {
  final h = hijriOf(d);
  final info = DayInfo(h, d.weekday);
  final hm = h.month, hd = h.day, wd = d.weekday;
  final noFast = (hm == 10 && hd == 1) || (hm == 12 && hd >= 10 && hd <= 13);
  var hasFast = false;
  if (hm == 9) {
    info.badges.add('Ramadan · day $hd');
    info.tasks.addAll(const [
      Task('suhoor', 'Suhoor', wNight, hadith: 'suhoor', special: true),
      Task('fast', 'Fasted today', wAny, hadith: 'ramadan', special: true),
      Task('iftar', 'Break the fast on time, with dua', wMaghrib, hadith: 'iftar', special: true),
      Task('taraweeh', 'Tarawih / night prayer', wIsha, hadith: 'taraweeh', special: true),
    ]);
    hasFast = true;
    info.hadithKey = const ['ramadan', 'suhoor', 'iftar', 'taraweeh'][hd % 4];
    if (hd >= 20) {
      final night = hd + 1;
      if (night.isOdd && night <= 29) info.badges.add('Tonight: night $night');
      info.hadithKey = 'afuww';
    }
  } else if (hm == 10 && hd == 1) {
    info.badges.add('Eid al-Fitr');
    info.tasks.addAll(const [
      Task('zakatfitr', 'Zakat al-Fitr, before the Eid prayer', wFajr, special: true),
      Task('eid', 'Ghusl, takbir and the Eid prayer', wDuha, special: true),
    ]);
  } else if (hm == 10) {
    info.tasks.add(const Task('fast', 'A fast of the six of Shawwal', wAny, hadith: 'shawwal', special: true));
    hasFast = true;
    if (hd >= 13 && hd <= 15) info.badges.add('White day');
    info.hadithKey = 'shawwal';
  } else if (hm == 12 && hd <= 9) {
    info.badges.add('Dhul-Hijjah · day $hd of the ten');
    info.tasks.add(const Task('takbir', 'Takbir, tahlil and tahmid often', wAny, hadith: 'tendays', special: true));
    info.hadithKey = 'tendays';
    if (hd == 9) {
      info.badges.add("Day of 'Arafah");
      info.tasks.add(const Task('fast', "Fast of 'Arafah", wAny, hadith: 'arafah', special: true));
      info.hadithKey = 'arafah';
    } else {
      info.tasks.add(const Task('fast', 'Fasted (first nine days)', wAny, hadith: 'tendays', special: true));
    }
    hasFast = true;
  } else if (hm == 12 && hd == 10) {
    info.badges.add('Eid al-Adha');
    info.tasks.addAll(const [
      Task('eid', 'Ghusl, takbir and the Eid prayer', wDuha, special: true),
      Task('udhiyah', 'Sacrifice (udhiyah)', wDuha, special: true),
    ]);
    info.hadithKey = 'tendays';
  } else if (hm == 12 && hd <= 13) {
    info.badges.add('Days of Tashriq');
    info.tasks.add(const Task('takbir', 'Takbir after each prayer', wAny, hadith: 'tashriq', special: true));
    info.hadithKey = 'tashriq';
  } else if (hm == 1 && hd == 1) {
    info.badges.add('1 Muharram · Hijri new year ${h.year}');
  } else if (hm == 1 && (hd == 9 || hd == 10)) {
    info.badges.add(hd == 9 ? "Tasu'a · 9 Muharram" : "'Ashura · 10 Muharram");
    info.tasks.add(Task('fast', hd == 9 ? 'Fast of the ninth (with Ashura)' : "Fast of 'Ashura", wAny, hadith: 'arafah', special: true));
    hasFast = true;
    info.hadithKey = 'arafah';
  }
  if (wd == 5) {
    info.badges.insert(0, "Jumu'ah");
    info.tasks.addAll(const [
      Task('jumuah', "Ghusl, best clothes, early to Jumu'ah", wDhuhr, hadith: 'jumuah', special: true),
      Task('kahf', 'Surat al-Kahf', wDuha, hadith: 'kahf', special: true),
      Task('hour', "Dua in the last hour after 'Asr", wAsr, hadith: 'hour', special: true),
    ]);
    info.hadithKey ??= (yearDay(d) ~/ 7).isEven ? 'kahf' : 'hour';
  }
  if (!hasFast && hm != 9 && !noFast) {
    if (hd >= 13 && hd <= 15) {
      info.badges.add('White day');
      info.tasks.add(const Task('fast', 'White-day fast (13 · 14 · 15)', wAny, hadith: 'white', special: true));
      info.hadithKey ??= 'white';
    } else if (wd == 1 || wd == 4) {
      info.tasks.add(const Task('fast', 'Sunnah fast (Monday and Thursday)', wAny, hadith: 'monthu', special: true));
      info.hadithKey ??= 'monthu';
    }
  }
  return info;
}

/// The everyday tasks, each in the window of the day where it belongs.
const baseTasks = [
  Task('qiyam', 'Night prayer, even two rak\'ahs', wNight, hadith: 'qiyam'),
  Task('adhkar_am', 'Morning adhkar', wFajr, hadith: 'adhkar'),
  Task('duha', 'Duha prayer', wDuha, hadith: 'duha'),
  Task('adhkar_pm', 'Evening adhkar', wAsr, hadith: 'adhkar'),
  Task('kin', 'Parents and kin: call, serve, dua', wMaghrib, hadith: 'kin'),
  Task('witr', 'Witr', wIsha, hadith: 'witr'),
  Task('tongue', 'Guarded my tongue today', wIsha, hadith: 'tongue'),
  Task('kursi', 'Ayat al-Kursi and the end of al-Baqarah', wIsha, hadith: 'kursi'),
  Task('sleep', 'Sleep with wudu, on my right side', wIsha, hadith: 'sleep'),
  Task('istighfar', 'Istighfar ×100', wAny, hadith: 'istighfar'),
  Task('salawat', 'Salawat on the Prophet ﷺ', wAny, hadith: 'salawat'),
  Task('sadaqah', 'Sadaqah or a kind act', wAny, hadith: 'sadaqah'),
];

/// Tasks for a date, by window.
Map<String, List<Task>> tasksFor(DateTime d, DayInfo info) {
  final out = <String, List<Task>>{for (final w in [...windowsInOrder, wAny]) w.id: <Task>[]};
  for (final t in info.tasks) {
    out[t.window.id]!.add(t);
  }
  for (final t in baseTasks) {
    out[t.window.id]!.add(t);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The hadith and Sunnah of the day and week
// ---------------------------------------------------------------------------
Hadith hadithOfDay(DateTime d, DayInfo info, Content c) {
  final key = info.hadithKey ?? c.rotation[(yearDay(d) * 29) % c.rotation.length];
  return c.hadith[key] ?? c.hadith[c.rotation.first]!;
}

WeeklyHadith hadithOfWeek(DateTime d, Content c) {
  WeeklyHadith byTitle(String t) => c.weekly.firstWhere((w) => w.title == t);
  final w = weekOf(d);
  final mid = hijriOf(addDays(w.start, w.length ~/ 2));
  if (mid.month == 8 && mid.day >= 22) return byTitle('The gates are opened');
  if (mid.month == 9) {
    return byTitle(const ['Fasting is for Allah', 'More than hunger', 'The most generous of people', 'Seek the Night of Decree'][((mid.day - 1) ~/ 7).clamp(0, 3)]);
  }
  if (mid.month == 10 && mid.day <= 10) return byTitle('Follow it with six');
  if (mid.month == 12 && mid.day <= 10) return byTitle('The ten best days');
  final plain = c.weekly.where((x) => !x.seasonal).toList();
  return plain[(w.number - 1) % plain.length];
}

Sunnah sunnahOfWeek(DateTime d, Content c) => c.sunnah[(weekOf(d).number - 1) % c.sunnah.length];
