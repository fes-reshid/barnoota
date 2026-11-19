import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../data/store.dart';
import '../logic/hisnul.dart';
import '../logic/plan.dart';
import '../logic/prayer.dart';
import '../logic/quran.dart';
import 'dial.dart';
import 'quran_goal.dart';
import 'widgets.dart';

/// The day, window by window: the prayer, and what goes with it.
class TodayScreen extends StatefulWidget {
  const TodayScreen({super.key});
  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  final _open = <String>{}; // windows the user opened or closed by hand, with a '-' prefix for closed
  String _lastDay = '';

  bool _isOpen(String id, bool isNow) {
    if (_open.contains('-$id')) return false;
    if (_open.contains(id)) return true;
    return isNow;
  }

  void _toggle(String id, bool isNow) {
    setState(() {
      final open = _isOpen(id, isNow);
      _open.removeAll([id, '-$id']);
      _open.add(open ? '-$id' : id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final date = app.selected;
    if (_lastDay != dateKey(date)) {
      _lastDay = dateKey(date);
      _open.clear();
    }
    final isToday = date == app.today;
    final times = app.timesOn(date);
    final info = dayInfo(date);
    final log = app.store.logFor(date);
    final tasks = tasksFor(date, info);
    final c = app.content;
    final nowWindow = isToday && times != null ? times.windowAt(app.now) : null;
    final next = app.place == null
        ? null
        : nextPrayer(app.now, app.place!, app.settings.method, app.settings.hanafi);

    return ListView(padding: const EdgeInsets.only(bottom: 28), children: [
      _Header(date: date, info: info, isToday: isToday, accent: windowColor(nowWindow)),
      const SizedBox(height: 14),
      if (!app.store.quran.isSet && !app.settings.quranPromptHidden) const _QuranStart(),
      if (times != null && next != null)
        Center(child: DayDial(times: times, now: app.now, isToday: isToday, next: next)),
      if (times != null) _PrayerStrip(times: times, log: log, place: app.place!.name),
      if (isToday && times != null) _AdhkarNudges(times: times, log: log),
      const SizedBox(height: 6),
      _NamePanel(index: nameIndexFor(date, c.names.length)),
      _AnyCard(tasks: tasks['any']!, log: log, date: date),
      for (final w in windowsInOrder)
        _WindowCard(
          def: w,
          times: times,
          tasks: tasks[w.id]!,
          log: log,
          isNow: nowWindow == w.id,
          open: _isOpen(w.id, nowWindow == w.id),
          onToggle: () => _toggle(w.id, nowWindow == w.id),
        ),
      const _SectionTitle('Today\'s three'),
      Panel(
        child: Column(children: [
          for (var i = 0; i < 3; i++)
            _LineField(
              key: ValueKey('pri$i-${dateKey(date)}'),
              hint: i == 0 ? 'The one thing that matters most' : 'Another that matters',
              text: log.priorities[i],
              leading: '${i + 1}',
              onChanged: (v) {
                log.priorities[i] = v;
                app.store.saveQuiet();
              },
            ),
        ]),
      ),
      const _SectionTitle('Before I sleep'),
      Panel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Eyebrow('Alhamdulillah for'),
          for (var i = 0; i < 3; i++)
            _LineField(
              key: ValueKey('gr$i-${dateKey(date)}'),
              hint: 'A blessing I am thankful for',
              text: log.gratitude[i],
              leading: '${i + 1}',
              onChanged: (v) {
                log.gratitude[i] = v;
                app.store.saveQuiet();
              },
            ),
          const SizedBox(height: 10),
          _LineField(key: ValueKey('bd-${dateKey(date)}'), hint: 'My best deed today', text: log.bestDeed, onChanged: (v) { log.bestDeed = v; app.store.saveQuiet(); }),
          _LineField(key: ValueKey('fg-${dateKey(date)}'), hint: 'I seek forgiveness for', text: log.forgive, onChanged: (v) { log.forgive = v; app.store.saveQuiet(); }),
          _LineField(key: ValueKey('tm-${dateKey(date)}'), hint: 'Tomorrow, in sha Allah', text: log.tomorrow, onChanged: (v) { log.tomorrow = v; app.store.saveQuiet(); }),
        ]),
      ),
      const _SectionTitle('Hadith of the day'),
      Panel(child: HadithView(hadithOfDay(date, info, c))),
      const _SectionTitle('This week'),
      _WeekPanel(date: date),
    ]);
  }
}

Color windowColor(String? id) => id == null ? Zc.green : windowsInOrder.firstWhere((w) => w.id == id).color;

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.fromLTRB(20, 14, 20, 8), child: Eyebrow(text));
}

class _Header extends StatelessWidget {
  const _Header({required this.date, required this.info, required this.isToday, required this.accent});
  final DateTime date;
  final DayInfo info;
  final bool isToday;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final h = info.hijri;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color.lerp(accent, Colors.black, .35)!, accent]),
        border: const Border(bottom: BorderSide(color: Zc.gold2, width: 3)),
      ),
      child: Column(children: [
        Row(children: [
          IconButton(icon: const Icon(Icons.chevron_left, color: Colors.white), tooltip: 'Previous day', onPressed: () => app.selectDay(addDays(date, -1))),
          Expanded(
            child: Column(children: [
              Text(weekdayNames[date.weekday - 1].toUpperCase(), style: display(22, color: Colors.white, letter: 2.4)),
              Text('${date.day} ${monthNames[date.month - 1]} ${date.year}', style: label(11.5, color: Zc.gold2, letter: 1.6, wght: 600)),
            ]),
          ),
          IconButton(icon: const Icon(Icons.chevron_right, color: Colors.white), tooltip: 'Next day', onPressed: () => app.selectDay(addDays(date, 1))),
        ]),
        Text('${weekdayAr[date.weekday - 1]} · ${h.arabic}', textDirection: TextDirection.rtl, style: ar(20, color: Zc.gold2, height: 1.5)),
        Text(h.text, style: label(10.5, color: Colors.white70, letter: 1.2)),
        if (info.badges.isNotEmpty || !isToday)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Wrap(spacing: 6, runSpacing: 6, alignment: WrapAlignment.center, children: [
              if (!isToday)
                ActionChip(
                  label: Text('Back to today', style: label(11, color: Zc.deep, letter: .4)),
                  backgroundColor: Zc.gold2,
                  side: BorderSide.none,
                  onPressed: () => app.selectDay(app.today),
                ),
              for (final b in info.badges)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Zc.gold2, borderRadius: BorderRadius.circular(14)),
                  child: Text(b.toUpperCase(), style: label(10, color: Zc.deep, letter: .8, wght: 700)),
                ),
            ]),
          ),
      ]),
    );
  }
}

class _PrayerStrip extends StatelessWidget {
  const _PrayerStrip({required this.times, required this.log, required this.place});
  final DayTimes times;
  final DayLog log;
  final String place;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            for (final p in prayers)
              Column(children: [
                Text(p.name, style: label(11, color: Zc.muted, letter: .3)),
                const SizedBox(height: 2),
                Text(clock(times.timeOfPrayer(p.id)), style: serif(15.5, wght: 600)),
                const SizedBox(height: 3),
                Icon(log.has(p.id, bitFard) ? Icons.check_circle : Icons.radio_button_unchecked, size: 17, color: log.has(p.id, bitFard) ? p.window.color : Zc.line),
              ]),
          ]),
          const SizedBox(height: 6),
          Text('${place.toUpperCase()}  ·  SUNRISE ${clock(times.sunrise)}', style: label(9.5, color: Zc.muted, letter: 1.2)),
        ]),
      );
}

class _NamePanel extends StatelessWidget {
  const _NamePanel({required this.index});
  final int index;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final n = app.content.names[index];
    final memorised = app.store.isMemorised(index);
    return Panel(
      color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF14302B) : Zc.soft,
      child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
        Column(children: [
          Text(n.arabic, textDirection: TextDirection.rtl, style: ar(38, color: Theme.of(context).colorScheme.primary, height: 1.5)),
          Text(n.transliteration, style: display(12.5, letter: 1)),
        ]),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Eyebrow('Name of the day · ${index + 1} of 99'),
            const SizedBox(height: 3),
            Text(n.meaning, style: serif(15, style: FontStyle.italic, color: Zc.muted)),
            const SizedBox(height: 5),
            Text(n.live, style: serif(14.5)),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                style: TextButton.styleFrom(visualDensity: VisualDensity.compact, padding: EdgeInsets.zero),
                onPressed: () {
                  if (!memorised) app.store.startName(index, app.today);
                  app.setTab(1);
                },
                icon: Icon(memorised ? Icons.verified : Icons.add_circle_outline, size: 17),
                label: Text(memorised ? 'Memorised' : 'Learn this name', style: label(11.5, letter: .4)),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _AnyCard extends StatelessWidget {
  const _AnyCard({required this.tasks, required this.log, required this.date});
  final List<Task> tasks;
  final DayLog log;
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.all_inclusive, size: 18, color: tone(context, Zc.green)),
          const SizedBox(width: 8),
          Text('THROUGH THE DAY', style: label(11, color: tone(context, Zc.green), letter: 1.6, wght: 700)),
        ]),
        const SizedBox(height: 6),
        _QuranRow(date: date, log: log),
        for (final t in tasks)
          TaskRow(
            task: t.label,
            checked: log.done.contains(t.id),
            hadith: t.hadith == null ? null : app.content.hadith[t.hadith],
            onChanged: (v) {
              v ? log.done.add(t.id) : log.done.remove(t.id);
              app.store.save();
            },
          ),
        const Divider(height: 22),
        Row(children: [
          Text('Water', style: label(11, color: Zc.muted, letter: .8)),
          const SizedBox(width: 8),
          for (var i = 1; i <= 8; i++)
            GestureDetector(
              onTap: () {
                log.water = log.water == i ? i - 1 : i;
                app.store.save();
              },
              child: Padding(padding: const EdgeInsets.all(1.5), child: Icon(Icons.water_drop, size: 20, color: i <= log.water ? const Color(0xFF3796BD) : Zc.line)),
            ),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          Text('My heart today', style: label(11, color: Zc.muted, letter: .8)),
          const SizedBox(width: 8),
          for (var i = 1; i <= 5; i++)
            GestureDetector(
              onTap: () {
                log.hearts = log.hearts == i ? i - 1 : i;
                app.store.save();
              },
              child: Padding(padding: const EdgeInsets.all(2), child: Icon(Icons.favorite, size: 21, color: i <= log.hearts ? Zc.maghrib : Zc.line)),
            ),
        ]),
      ]),
    );
  }
}

class _WindowCard extends StatelessWidget {
  const _WindowCard({required this.def, required this.times, required this.tasks, required this.log, required this.isNow, required this.open, required this.onToggle});
  final WindowDef def;
  final DayTimes? times;
  final List<Task> tasks;
  final DayLog log;
  final bool isNow, open;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final prayer = prayers.where((p) => p.window.id == def.id).firstOrNull;
    final doneTasks = tasks.where((t) => log.done.contains(t.id)).length;
    final total = tasks.length + (prayer != null ? 1 : 0);
    final done = doneTasks + (prayer != null && log.has(prayer.id, bitFard) ? 1 : 0);
    final range = times == null ? '' : '${clock(times!.startOf(def.id))} – ${clock(times!.endOf(def.id))}';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: isNow ? def.color : Zc.line.withValues(alpha: .7), width: isNow ? 2 : 1),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          InkWell(
            onTap: onToggle,
            child: Container(
              color: def.color.withValues(alpha: isNow ? .14 : .07),
              padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
              child: Row(children: [
                CircleAvatar(radius: 17, backgroundColor: def.color, child: Icon(def.icon, size: 19, color: Colors.white)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text(def.name, style: display(15, letter: .8)),
                      const SizedBox(width: 8),
                      Text(def.arabic, textDirection: TextDirection.rtl, style: ar(16, color: tone(context, def.color), height: 1.3)),
                      if (isNow) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: def.color, borderRadius: BorderRadius.circular(10)),
                          child: Text('NOW', style: label(9, color: Colors.white, letter: 1, wght: 700)),
                        ),
                      ],
                    ]),
                    Text(range, style: label(10.5, color: Zc.muted, letter: .8)),
                  ]),
                ),
                Text('$done/$total', style: label(12, color: done == total ? tone(context, def.color) : Zc.muted, letter: .4, wght: 700)),
                Icon(open ? Icons.expand_less : Icons.expand_more, color: Zc.muted),
              ]),
            ),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (prayer != null) _PrayerChips(prayer: prayer, log: log, color: def.color),
                if (prayer != null && tasks.isNotEmpty) const SizedBox(height: 6),
                for (final t in tasks)
                  TaskRow(
                    task: t.label,
                    color: def.color,
                    checked: log.done.contains(t.id),
                    hadith: t.hadith == null ? null : app.content.hadith[t.hadith],
                    extra: _adhkarChapter(t.id) == null
                        ? null
                        : IconButton(
                            visualDensity: VisualDensity.compact,
                            tooltip: 'Read in Hisnul Muslim',
                            icon: Icon(Icons.auto_stories, size: 21, color: tone(context, def.color)),
                            onPressed: () => app.hisnul(_adhkarChapter(t.id)!),
                          ),
                    onChanged: (v) {
                      v ? log.done.add(t.id) : log.done.remove(t.id);
                      app.store.save();
                    },
                  ),
              ]),
            ),
        ]),
      ),
    );
  }
}

class _PrayerChips extends StatelessWidget {
  const _PrayerChips({required this.prayer, required this.log, required this.color});
  final PrayerDef prayer;
  final DayLog log;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    void tap(int bit) {
      log.toggle(prayer.id, bit);
      app.store.save();
    }
    return Wrap(spacing: 8, runSpacing: 8, children: [
      ZChip(title: 'Prayed', color: color, selected: log.has(prayer.id, bitFard), onTap: () => tap(bitFard)),
      ZChip(title: 'On time', color: color, selected: log.has(prayer.id, bitOnTime), onTap: () => tap(bitOnTime)),
      ZChip(title: 'In jama\'ah', color: color, selected: log.has(prayer.id, bitJamaah), onTap: () => tap(bitJamaah)),
      if (prayer.sunnah.isNotEmpty) ZChip(title: 'Sunnah', sub: prayer.sunnah, color: color, selected: log.has(prayer.id, bitSunnah), onTap: () => tap(bitSunnah)),
      ZChip(title: 'Dhikr after', color: color, selected: log.has(prayer.id, bitDhikr), onTap: () => tap(bitDhikr)),
    ]);
  }
}

class _LineField extends StatelessWidget {
  const _LineField({super.key, required this.hint, required this.text, required this.onChanged, this.leading});
  final String hint, text;
  final String? leading;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => TextFormField(
        initialValue: text,
        onChanged: onChanged,
        minLines: 1,
        maxLines: 3,
        textCapitalization: TextCapitalization.sentences,
        style: serif(15.5),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: serif(15, color: Zc.muted.withValues(alpha: .7), style: FontStyle.italic),
          prefixIcon: leading == null ? null : Padding(padding: const EdgeInsets.only(left: 2, right: 10), child: Text(leading!, style: display(15, color: Zc.gold))),
          prefixIconConstraints: const BoxConstraints(minWidth: 20, minHeight: 20),
          isDense: true,
          border: const UnderlineInputBorder(borderSide: BorderSide(color: Zc.line)),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Zc.line)),
        ),
      );
}

class _WeekPanel extends StatelessWidget {
  const _WeekPanel({required this.date});
  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final c = app.content;
    final w = weekOf(date);
    final wh = hadithOfWeek(date, c);
    final sn = sunnahOfWeek(date, c);
    final names = namesOfWeek(w.number, c.names.length);
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Eyebrow('Week ${w.number} · ${wh.title}'),
        const SizedBox(height: 8),
        HadithView(wh.hadith),
        const SizedBox(height: 8),
        Text.rich(TextSpan(children: [
          TextSpan(text: 'LIVE IT  ', style: label(10, color: Zc.gold, letter: 1.2, wght: 700)),
          TextSpan(text: wh.action, style: serif(15)),
        ])),
        const Divider(height: 26),
        const Eyebrow('A Sunnah to practise this week'),
        const SizedBox(height: 4),
        Text(sn.text, style: serif(15.5)),
        Text(sn.ref.toUpperCase(), style: label(9.5, color: Zc.muted, letter: 1)),
        if (names.isNotEmpty) ...[
          const Divider(height: 26),
          const Eyebrow('Names to memorise this week'),
          const SizedBox(height: 6),
          Wrap(spacing: 18, children: [
            for (final i in names)
              Column(children: [
                Text(c.names[i].arabic, textDirection: TextDirection.rtl, style: ar(26, color: Theme.of(context).colorScheme.primary, height: 1.5)),
                Text(c.names[i].transliteration, style: display(11.5, letter: .8)),
              ]),
          ]),
        ],
      ]),
    );
  }
}

/// Which chapter of Hisnul Muslim holds the adhkar for a task, if it is one of the adhkar.
int? _adhkarChapter(String taskId) => switch (taskId) {
      'adhkar_am' => hisnulMorning,
      'adhkar_pm' => hisnulEvening,
      _ => null,
    };

/// Today's Qur'an reading from the daily goal: the pages, the juz, and a tick.
class _QuranRow extends StatelessWidget {
  const _QuranRow({required this.date, required this.log});
  final DateTime date;
  final DayLog log;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final plan = app.store.quran;
    if (!plan.isSet) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          const Icon(Icons.menu_book, color: Zc.green),
          const SizedBox(width: 12),
          Expanded(child: Text('How much Qur\'an can you read each day?', style: serif(15.5))),
          FilledButton.tonal(onPressed: () => showQuranGoal(context), child: const Text('Set my goal')),
        ]),
      );
    }
    final r = plan.rangeFor(date)!;
    final read = log.quranPages > 0;
    final j1 = juzOfPage(r.from), j2 = juzOfPage(r.to);
    final where = r.from == r.to ? 'Page ${r.from}' : 'Pages ${r.from} to ${r.to}';
    return TaskRow(
      task: "Qur'an: ${where.toLowerCase()}",
      subtitle: '${j1 == j2 ? 'JUZ $j1' : 'JUZ $j1 TO $j2'} · ${describePages(plan.perDay).toUpperCase()}',
      checked: read,
      hadith: app.content.hadith['quran'],
      extra: IconButton(
        visualDensity: VisualDensity.compact,
        tooltip: 'Change my Qur\'an goal',
        icon: const Icon(Icons.tune, size: 20, color: Zc.muted),
        onPressed: () => showQuranGoal(context),
      ),
      onChanged: (v) => app.store.setQuranRead(date, v),
    );
  }
}

/// Reminds you, on today's page, to read the morning and evening adhkar, and sends you to Hisnul Muslim to read them.
/// First thing on Today until a daily Qur'an goal is chosen (or the card is dismissed).
class _QuranStart extends StatelessWidget {
  const _QuranStart();

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Panel(
      key: const ValueKey('quran-start'),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('QUR\'AN', style: label(11, color: Zc.gold)),
        const SizedBox(height: 6),
        Text('How much can you read each day? Choose pages or juz, or how long you want to take to finish, and Zaad plans every day for you.', style: serif(15)),
        const SizedBox(height: 10),
        Row(children: [
          FilledButton.icon(onPressed: () => showQuranGoal(context), icon: const Icon(Icons.menu_book), label: const Text('Set my daily Qur\'an')),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () {
              app.settings.quranPromptHidden = true;
              app.store.save();
            },
            child: const Text('Not now'),
          ),
        ]),
      ]),
    );
  }
}

class _AdhkarNudges extends StatelessWidget {
  const _AdhkarNudges({required this.times, required this.log});
  final DayTimes times;
  final DayLog log;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final now = app.now;
    final morning = !now.isBefore(times.fajr) && now.isBefore(times.asr) && !log.done.contains('adhkar_am');
    final evening = !now.isBefore(times.asr) && !log.done.contains('adhkar_pm');
    return Column(children: [
      if (morning)
        _Nudge(
          key: const ValueKey('nudge-morning'),
          icon: Icons.wb_twilight,
          color: Zc.fajr,
          title: now.isBefore(times.duhaStart) ? 'Time for your morning adhkar' : 'You have not read your morning adhkar yet',
          body: now.isBefore(times.duhaStart) ? 'Read them now, while the day is new.' : 'It is not too late. Read them now.',
          chapter: hisnulMorning,
          onDone: () {
            log.done.add('adhkar_am');
            app.store.save();
          },
        ),
      if (evening)
        _Nudge(
          key: const ValueKey('nudge-evening'),
          icon: Icons.nights_stay_outlined,
          color: Zc.maghrib,
          title: now.isBefore(times.maghrib) ? 'Time for your evening adhkar' : 'You have not read your evening adhkar yet',
          body: now.isBefore(times.maghrib) ? 'Read them before the sun sets.' : 'It is not too late. Read them tonight.',
          chapter: hisnulEvening,
          onDone: () {
            log.done.add('adhkar_pm');
            app.store.save();
          },
        ),
    ]);
  }
}

class _Nudge extends StatelessWidget {
  const _Nudge({super.key, required this.icon, required this.color, required this.title, required this.body, required this.chapter, required this.onDone});
  final IconData icon;
  final Color color;
  final String title, body;
  final int chapter;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color, width: 1.6),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(radius: 17, backgroundColor: color, child: Icon(icon, size: 19, color: Colors.white)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: serif(15.5, wght: 650)),
                Text(body, style: serif(13.5, color: Zc.muted)),
              ]),
            ),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: color),
                onPressed: () => app.hisnul(chapter),
                icon: const Icon(Icons.auto_stories, size: 18),
                label: const Text('Read in Hisnul Muslim'),
              ),
            ),
            const SizedBox(width: 8),
            TextButton(onPressed: onDone, child: Text('I read them', style: TextStyle(color: tone(context, color)))),
          ]),
        ]),
      ),
    );
  }
}
