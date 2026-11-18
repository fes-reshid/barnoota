import 'package:flutter_test/flutter_test.dart';
import 'package:zaad/logic/plan.dart';
import 'package:zaad/logic/quran.dart';

QuranPlan plan(int perDay, {int offset = 0, Map<String, int> read = const {}}) => QuranPlan(perDay: perDay, offset: offset, pagesByDate: read);

void main() {
  test('which juz a page is in', () {
    expect(juzOfPage(1), 1);
    expect(juzOfPage(21), 1);
    expect(juzOfPage(22), 2);
    expect(juzOfPage(41), 2);
    expect(juzOfPage(42), 3);
    expect(juzOfPage(581), 29);
    expect(juzOfPage(582), 30);
    expect(juzOfPage(604), 30);
    expect(juzOfPage(0), 1);
    expect(juzOfPage(900), 30);
  });

  test('how many pages a day finishes the Qur\'an in a given time', () {
    expect(pagesPerDayToFinishIn(30), 21);
    expect(pagesPerDayToFinishIn(60), 11);
    expect(pagesPerDayToFinishIn(365), 2);
    expect((604 / pagesPerDayToFinishIn(30)).ceil() <= 30, isTrue);
    expect((604 / pagesPerDayToFinishIn(90)).ceil() <= 90, isTrue);
  });

  test('describing a goal in words', () {
    expect(describePages(7), '7 pages a day');
    expect(describePages(5), '5 pages a day (a quarter of a juz)');
    expect(describePages(1), '1 page a day');
    expect(describePages(20), '20 pages a day (1 juz)');
    expect(describePages(10), '10 pages a day (half a juz)');
    expect(describePages(5 * 4 * 2), '40 pages a day (2 juz)');
    expect(describePages(0), 'not set');
  });

  test('each day carries on from where the last one ended', () {
    final d1 = DateTime(2026, 11, 18), d2 = DateTime(2026, 11, 19), d3 = DateTime(2026, 11, 20);
    expect(plan(5).rangeFor(d1), (from: 1, to: 5));
    final p = plan(5, read: {dateKey(d1): 5});
    expect(p.rangeFor(d1), (from: 1, to: 5)); // the day itself does not move
    expect(p.rangeFor(d2), (from: 6, to: 10));
    expect(plan(5, read: {dateKey(d1): 5, dateKey(d2): 5}).rangeFor(d3), (from: 11, to: 15));
    // a missed day does not skip pages
    expect(plan(5, read: {dateKey(d1): 5}).rangeFor(d3), (from: 6, to: 10));
  });

  test('without a goal there is no reading', () {
    expect(plan(0).isSet, isFalse);
    expect(plan(0).rangeFor(DateTime(2026, 1, 1)), isNull);
    expect(plan(0).pagesFor(DateTime(2026, 1, 1)), 0);
    expect(plan(0).finish(DateTime(2026, 1, 1)), isNull);
  });

  test('a day stops at the end of the Qur\'an and the next starts again at page 1', () {
    final d1 = DateTime(2026, 11, 18), d2 = DateTime(2026, 11, 19);
    final p = plan(10, offset: 600);
    expect(p.rangeFor(d1), (from: 601, to: 604));
    expect(p.pagesFor(d1), 4);
    final done = plan(10, offset: 600, read: {dateKey(d1): 4});
    expect(done.rangeFor(d2), (from: 1, to: 10));
    expect(done.khatmahs, 1);
    expect(done.nextPage, 1);
  });

  test('khatmahs, the next page, and the finish date', () {
    final today = DateTime(2026, 11, 18);
    final read = {for (var i = 0; i < 120; i++) dateKey(addDays(today, -i - 1)): 5}; // 600 pages
    final p = plan(5, read: read);
    expect(p.totalRead, 600);
    expect(p.nextPage, 601);
    expect(p.khatmahs, 0);
    final f = p.finish(today)!;
    expect(f.days, 1);
    expect(f.date, today);
    expect(plan(20).finish(today)!.days, 31); // 604 pages at 20 a day
    expect(plan(20).finish(today)!.date, addDays(today, 30));
    expect(plan(5, read: {...read, dateKey(today): 4}).khatmahs, 1);
  });

  test('starting part way through counts from that page, and only finished readings count', () {
    final p = plan(10, offset: 299); // next page is 300
    expect(p.nextPage, 300);
    expect(p.rangeFor(DateTime(2026, 11, 18)), (from: 300, to: 309));
    expect(p.khatmahs, 0); // being part way through is not a khatmah
    expect(p.finish(DateTime(2026, 11, 18))!.days, 31); // 305 pages left at ten a day
  });

  test('days read in a range of dates', () {
    final p = plan(5, read: {'2026-11-02': 5, '2026-11-03': 5, '2026-12-01': 5});
    expect(p.daysRead(DateTime(2026, 11, 1), DateTime(2026, 11, 30)), 2);
  });
}
