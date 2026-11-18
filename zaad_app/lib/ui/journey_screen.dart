import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../data/store.dart';
import '../logic/plan.dart';
import '../logic/quran.dart';
import 'quran_goal.dart';
import 'widgets.dart';

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({super.key});
  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  late DateTime month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final s = app.store;
    final today = app.today;
    final streak = s.streak(today);
    var weekOnTime = 0, weekPrayed = 0;
    for (var i = 0; i < 7; i++) {
      final l = s.peek(addDays(today, -i));
      weekOnTime += l?.onTimeCount ?? 0;
      weekPrayed += l?.prayedCount ?? 0;
    }
    final nDays = DateTime(month.year, month.month + 1, 0).day;
    var fasts = 0, sadaqah = 0, full = 0;
    for (var d = 1; d <= nDays; d++) {
      final l = s.peek(DateTime(month.year, month.month, d));
      if (l == null) continue;
      if (l.done.contains('fast')) fasts++;
      if (l.done.contains('sadaqah')) sadaqah++;
      if (l.prayedCount >= 5) full++;
    }
    return ListView(padding: const EdgeInsets.only(bottom: 28), children: [
      Container(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        decoration: const BoxDecoration(gradient: LinearGradient(colors: [Zc.deep, Zc.green]), border: Border(bottom: BorderSide(color: Zc.gold2, width: 3))),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _Stat('$streak', streak == 1 ? 'day streak' : 'day streak', Icons.local_fire_department),
          _Stat('$weekPrayed/35', 'prayed, 7 days', Icons.check_circle_outline),
          _Stat('$weekOnTime', 'on time, 7 days', Icons.schedule),
        ]),
      ),
      const SizedBox(height: 14),
      const _Title('Last seven days'),
      Panel(child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [for (var i = 6; i >= 0; i--) _DayDots(date: addDays(today, -i))])),
      const _Title('Calendar'),
      Panel(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 12),
        child: Column(children: [
          Row(children: [
            IconButton(onPressed: () => setState(() => month = DateTime(month.year, month.month - 1)), icon: const Icon(Icons.chevron_left)),
            Expanded(child: Text('${monthNames[month.month - 1]} ${month.year}', textAlign: TextAlign.center, style: display(17))),
            IconButton(onPressed: () => setState(() => month = DateTime(month.year, month.month + 1)), icon: const Icon(Icons.chevron_right)),
          ]),
          _MonthGrid(month: month),
          const SizedBox(height: 8),
          Wrap(spacing: 14, runSpacing: 4, children: const [
            _Key(Zc.green, 'All five'),
            _Key(Color(0xFF7FB5A6), 'Some'),
            _Key(Zc.isha, 'Ramadan'),
            _Key(Zc.gold, 'Eid'),
          ]),
        ]),
      ),
      Panel(
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _Mini('$full', 'days with all\nfive prayers'),
          _Mini('$fasts', 'days fasted\nthis month'),
          _Mini('$sadaqah', 'days of\nsadaqah'),
        ]),
      ),
      const _Title('Qur\'an'),
      _QuranPanel(month: month),
      const _Title('My duas'),
      const _DuaPanel(),
    ]);
  }
}

class _Title extends StatelessWidget {
  const _Title(this.t);
  final String t;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 8), child: Eyebrow(t));
}

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.caption, this.icon);
  final String value, caption;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Column(children: [
        Icon(icon, color: Zc.gold2, size: 22),
        Text(value, style: display(26, color: Colors.white, letter: .6)),
        Text(caption.toUpperCase(), style: label(9.5, color: Zc.gold2, letter: 1.2)),
      ]);
}

class _Mini extends StatelessWidget {
  const _Mini(this.value, this.caption);
  final String value, caption;
  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value, style: display(24, color: Theme.of(context).colorScheme.primary)),
        Text(caption, textAlign: TextAlign.center, style: serif(12.5, color: Zc.muted, height: 1.25)),
      ]);
}

class _Key extends StatelessWidget {
  const _Key(this.color, this.text);
  final Color color;
  final String text;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 5),
        Text(text, style: label(10.5, color: Zc.muted, letter: .3, wght: 500)),
      ]);
}

class _DayDots extends StatelessWidget {
  const _DayDots({required this.date});
  final DateTime date;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final l = app.store.peek(date);
    return GestureDetector(
      onTap: () => app.goToDay(date),
      child: Column(children: [
        Text(weekdayNames[date.weekday - 1].substring(0, 1), style: label(11, color: Zc.muted)),
        const SizedBox(height: 4),
        for (final p in prayers)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 1.5),
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (l?.has(p.id, bitOnTime) ?? false) ? p.window.color : ((l?.has(p.id, bitFard) ?? false) ? p.window.color.withValues(alpha: .45) : Colors.transparent),
                border: Border.all(color: p.window.color.withValues(alpha: .5), width: 1.2),
              ),
            ),
          ),
        const SizedBox(height: 4),
        Text('${date.day}', style: label(10.5, color: Zc.muted, letter: 0)),
      ]),
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({required this.month});
  final DateTime month;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final first = DateTime(month.year, month.month, 1);
    final nDays = DateTime(month.year, month.month + 1, 0).day;
    final lead = first.weekday - 1;
    final cells = <Widget>[
      for (final d in const ['M', 'T', 'W', 'T', 'F', 'S', 'S']) Center(child: Text(d, style: label(10.5, color: Zc.muted))),
      for (var i = 0; i < lead; i++) const SizedBox(),
    ];
    for (var d = 1; d <= nDays; d++) {
      final date = DateTime(month.year, month.month, d);
      final l = app.store.peek(date);
      final h = hijriOf(date);
      final n = l?.prayedCount ?? 0;
      final ramadan = h.month == 9;
      final eid = (h.month == 10 && h.day == 1) || (h.month == 12 && h.day == 10);
      final isToday = date == app.today;
      cells.add(GestureDetector(
        onTap: () => app.goToDay(date),
        child: Container(
          margin: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: n >= 5 ? Zc.green : (n > 0 ? Color.lerp(const Color(0xFFD7EAE4), const Color(0xFF7FB5A6), n / 4) : (ramadan ? Zc.isha.withValues(alpha: .1) : null)),
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: eid ? Zc.gold : (isToday ? Zc.gold : (ramadan ? Zc.isha.withValues(alpha: .45) : Colors.transparent)), width: isToday || eid ? 2 : 1),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('$d', style: serif(14, wght: 650, color: n >= 5 ? Colors.white : null, height: 1.1)),
            Text('${h.day}', style: label(8, color: n >= 5 ? Colors.white70 : Zc.muted, letter: 0, wght: 500)),
          ]),
        ),
      ));
    }
    return GridView.count(crossAxisCount: 7, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), childAspectRatio: 1.0, children: cells);
  }
}

class _QuranPanel extends StatelessWidget {
  const _QuranPanel({required this.month});
  final DateTime month;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final plan = app.store.quran;
    if (!plan.isSet) {
      return Panel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('How much can you read each day? Choose pages or juz, or how long you want to take to finish, and Zaad plans every day for you.', style: serif(15)),
          const SizedBox(height: 10),
          FilledButton.icon(onPressed: () => showQuranGoal(context), icon: const Icon(Icons.menu_book), label: const Text('Set my daily Qur\'an')),
        ]),
      );
    }
    final fin = plan.finish(app.today)!;
    final last = DateTime(month.year, month.month + 1, 0);
    final readDays = plan.daysRead(DateTime(month.year, month.month, 1), last);
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('Next: page ${plan.nextPage} · Juz ${juzOfPage(plan.nextPage)}', style: serif(16.5, wght: 650))),
          TextButton(onPressed: () => showQuranGoal(context), child: const Text('Change')),
        ]),
        const SizedBox(height: 6),
        ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: (plan.nextPage - 1) / mushafPages, minHeight: 10)),
        const SizedBox(height: 6),
        Text('${plan.nextPage - 1} of $mushafPages pages · ${describePages(plan.perDay)}', style: serif(13.5, color: Zc.muted)),
        const SizedBox(height: 4),
        Text('At this pace you finish around ${fin.date.day} ${monthNames[fin.date.month - 1]} ${fin.date.year}, in sha Allah.', style: serif(13.5, color: Zc.muted)),
        const Divider(height: 24),
        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _Mini('${plan.khatmahs}', plan.khatmahs == 1 ? 'khatmah\nfinished' : 'khatmahs\nfinished'),
          _Mini('$readDays', 'days read in\n${monthNames[month.month - 1]}'),
          _Mini('${plan.totalRead}', 'pages read\nwith Zaad'),
        ]),
      ]),
    );
  }
}

class _DuaPanel extends StatelessWidget {
  const _DuaPanel();
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final s = app.store;
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (s.duas.isEmpty) Text('Write what you are asking Allah for, and mark it when He answers.', style: serif(14.5, color: Zc.muted)),
        for (final d in s.duas)
          Row(children: [
            Checkbox(value: d.answered, onChanged: (v) { d.answered = v ?? false; s.save(); }),
            Expanded(child: Text(d.text, style: serif(15.5).copyWith(decoration: d.answered ? TextDecoration.lineThrough : null))),
            IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () { s.duas.remove(d); s.save(); }),
          ]),
        TextButton.icon(
          onPressed: () async {
            final text = await showDialog<String>(context: context, builder: (_) => const _AskDialog());
            if (text != null && text.trim().isNotEmpty) {
              s.duas.add(DuaItem(text.trim(), dateKey(app.today)));
              s.save();
            }
          },
          icon: const Icon(Icons.add),
          label: const Text('Add a dua'),
        ),
      ]),
    );
  }
}

class _AskDialog extends StatefulWidget {
  const _AskDialog();
  @override
  State<_AskDialog> createState() => _AskDialogState();
}

class _AskDialogState extends State<_AskDialog> {
  final c = TextEditingController();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('A dua'),
        content: TextField(controller: c, autofocus: true, maxLines: 3, decoration: const InputDecoration(hintText: 'I am asking Allah for...')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, c.text), child: const Text('Add')),
        ],
      );
}
