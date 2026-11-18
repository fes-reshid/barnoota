import 'plan.dart';

/// The Qur'an in the standard 604-page Madinah mushaf, thirty juz of twenty pages (the first has twenty-one).
const mushafPages = 604;
const pagesPerJuz = 20;

/// Juz (1 to 30) that a page (1 to 604) is in.
int juzOfPage(int page) {
  final p = page.clamp(1, mushafPages);
  return p < 22 ? 1 : (((p - 2) ~/ pagesPerJuz) + 1).clamp(1, 30);
}

/// Presets for "finish the Qur'an in ...": days and the pages a day that needs.
const finishPresets = <(String, int)>[
  ('30 days', 30), ('60 days', 60), ('90 days', 90), ('6 months', 182), ('1 year', 365),
];

int pagesPerDayToFinishIn(int days) => (mushafPages / days).ceil();

/// What a number of pages a day means, in words.
String describePages(int pages) {
  if (pages <= 0) return 'not set';
  final juz = pages / pagesPerJuz;
  final j = juz == juz.roundToDouble()
      ? '${juz.round()} juz'
      : juz == 0.5
          ? 'half a juz'
          : juz == 0.25
              ? 'a quarter of a juz'
              : null;
  final base = '$pages ${pages == 1 ? 'page' : 'pages'} a day';
  return j == null ? base : '$base ($j)';
}

/// A daily Qur'an goal and the reading done so far.
///
/// The place in the Qur'an is never stored. It is worked out from the pages recorded on each day, so ticking, un-ticking,
/// restoring a backup and finishing a khatmah always agree.
class QuranPlan {
  QuranPlan({required this.perDay, required this.offset, required this.pagesByDate});

  /// Pages to read each day. Zero means no goal has been chosen yet.
  final int perDay;

  /// Pages already read when the plan began, so someone half way through can carry on from where they are.
  final int offset;

  /// Pages recorded on each day, keyed by the date (yyyy-mm-dd).
  final Map<String, int> pagesByDate;

  bool get isSet => perDay > 0;

  int get totalRead => pagesByDate.values.fold(0, (a, b) => a + b);

  int _before(DateTime day) {
    final k = dateKey(day);
    var sum = 0;
    pagesByDate.forEach((d, p) {
      if (d.compareTo(k) < 0) sum += p;
    });
    return sum;
  }

  /// Pages finished before the start of [day], counted from the first page of the Qur'an.
  int positionBefore(DateTime day) => (offset + _before(day)) % mushafPages;

  /// The pages to read on [day]: from, to (a day's reading stops at the end of the Qur'an and the next day starts again at page 1).
  ({int from, int to})? rangeFor(DateTime day) {
    if (!isSet) return null;
    final from = positionBefore(day) + 1;
    final to = (from + perDay - 1).clamp(from, mushafPages);
    return (from: from, to: to);
  }

  int pagesFor(DateTime day) {
    final r = rangeFor(day);
    return r == null ? 0 : r.to - r.from + 1;
  }

  /// Complete readings of the whole Qur'an (not counting any that were done before the plan began).
  int get khatmahs => (offset + totalRead) ~/ mushafPages - offset ~/ mushafPages;

  /// Where the reader is now: the next page to read.
  int get nextPage => (offset + totalRead) % mushafPages + 1;

  /// Days left to finish this khatmah at the daily goal, and the date it would be done, counting from [today].
  ({int days, DateTime date})? finish(DateTime today) {
    if (!isSet) return null;
    final left = mushafPages - (nextPage - 1);
    final days = (left / perDay).ceil();
    return (days: days, date: addDays(today, days - 1));
  }

  /// Days with some reading recorded.
  int daysRead(DateTime from, DateTime to) {
    var n = 0;
    for (var d = from; !d.isAfter(to); d = addDays(d, 1)) {
      if ((pagesByDate[dateKey(d)] ?? 0) > 0) n++;
    }
    return n;
  }
}
