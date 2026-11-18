import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../logic/plan.dart';
import '../logic/quran.dart';
import 'widgets.dart';

/// "How much can I read each day?": pages or juz, or how long to finish in, and where to start.
Future<void> showQuranGoal(BuildContext context) => showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: const _GoalSheet(),
      ),
    );

class _GoalSheet extends StatefulWidget {
  const _GoalSheet();
  @override
  State<_GoalSheet> createState() => _GoalSheetState();
}

class _GoalSheetState extends State<_GoalSheet> {
  int? pages;
  bool? juz;
  int? start;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final s = app.settings;
    final plan = app.store.quran;
    final p = pages ?? (s.quranPerDay > 0 ? s.quranPerDay : 5);
    final inJuz = juz ?? s.quranInJuz;
    final from = start ?? plan.nextPage;
    final left = mushafPages - (from - 1);
    final days = (left / p).ceil();
    final done = addDays(app.today, days - 1);
    final step = inJuz ? pagesPerJuz ~/ 4 : 1; // a quarter of a juz, or one page
    final shown = inJuz ? _juzText(p) : '$p ${p == 1 ? 'page' : 'pages'}';

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 0, 22, 22),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('My daily Qur\'an', style: display(20)),
          const SizedBox(height: 4),
          Text('Choose how much you can read each day, and the app plans the rest.', style: serif(14.5, color: Zc.muted)),
          const SizedBox(height: 16),
          Center(
            child: SegmentedButton<bool>(
              segments: const [ButtonSegment(value: false, label: Text('Pages')), ButtonSegment(value: true, label: Text('Juz'))],
              selected: {inJuz},
              onSelectionChanged: (v) => setState(() => juz = v.first),
            ),
          ),
          const SizedBox(height: 14),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            IconButton.filledTonal(
              onPressed: p > step ? () => setState(() => pages = (p - step).clamp(1, 200)) : null,
              icon: const Icon(Icons.remove),
              tooltip: 'Less',
            ),
            SizedBox(width: 170, child: Text(shown, textAlign: TextAlign.center, style: display(24, letter: .4))),
            IconButton.filledTonal(onPressed: () => setState(() => pages = (p + step).clamp(1, 200)), icon: const Icon(Icons.add), tooltip: 'More'),
          ]),
          const SizedBox(height: 4),
          Center(child: Text(describePages(p), style: serif(14, color: Zc.muted, style: FontStyle.italic))),
          const SizedBox(height: 16),
          const Eyebrow('Or finish the Qur\'an in'),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final (label, d) in finishPresets)
              ChoiceChip(
                label: Text('$label · ${pagesPerDayToFinishIn(d)} a day'),
                selected: p == pagesPerDayToFinishIn(d),
                onSelected: (_) => setState(() => pages = pagesPerDayToFinishIn(d)),
              ),
          ]),
          const SizedBox(height: 16),
          const Eyebrow('I am at page'),
          const SizedBox(height: 6),
          Row(children: [
            SizedBox(
              width: 110,
              child: TextFormField(
                key: ValueKey('start-${plan.nextPage}'),
                initialValue: '$from',
                keyboardType: TextInputType.number,
                onChanged: (v) {
                  final n = int.tryParse(v);
                  if (n != null && n >= 1 && n <= mushafPages) setState(() => start = n);
                },
                decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text('of $mushafPages · Juz ${juzOfPage(from)}. Leave it if you are starting now.', style: serif(13.5, color: Zc.muted))),
          ]),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF14302B) : Zc.soft, borderRadius: BorderRadius.circular(14)),
            child: Text('At ${describePages(p)} you finish in $days ${days == 1 ? 'day' : 'days'}, around ${done.day} ${monthNames[done.month - 1]} ${done.year}, in sha Allah.',
                style: serif(15.5)),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                s.quranPerDay = p;
                s.quranInJuz = inJuz;
                if (start != null && start != plan.nextPage) app.store.setQuranPosition(start!);
                app.store.save();
                Navigator.pop(context);
              },
              child: const Text('Save my goal'),
            ),
          ),
        ]),
      ),
    );
  }

  String _juzText(int pages) {
    final j = pages / pagesPerJuz;
    if (j == j.roundToDouble()) return '${j.round()} juz';
    final whole = j.floor();
    final frac = j - whole;
    final q = (frac * 4).round();
    final f = const {1: '¼', 2: '½', 3: '¾'}[q] ?? '';
    return whole == 0 ? '$f juz' : '$whole$f juz';
  }
}
