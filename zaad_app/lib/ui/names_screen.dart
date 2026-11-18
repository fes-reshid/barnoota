import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../data/content.dart';
import '../logic/plan.dart';
import 'widgets.dart';

class NamesScreen extends StatelessWidget {
  const NamesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final c = app.content;
    final store = app.store;
    final memorised = store.memorisedCount;
    final due = store.dueNames(app.today);
    final week = weekOf(app.today);
    final weekNames = namesOfWeek(week.number, c.names.length);
    return ListView(padding: const EdgeInsets.only(bottom: 24), children: [
      Container(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        decoration: const BoxDecoration(gradient: LinearGradient(colors: [Zc.deep, Zc.green]), border: Border(bottom: BorderSide(color: Zc.gold2, width: 3))),
        child: Column(children: [
          Text('99 NAMES OF ALLAH', style: display(20, color: Zc.gold2, letter: 2.4)),
          Text('الأَسْمَاءُ الحُسْنَى', style: ar(26, color: Zc.gold2, height: 1.5)),
          const SizedBox(height: 10),
          ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: memorised / 99, minHeight: 10, backgroundColor: Colors.white24, color: Zc.gold2)),
          const SizedBox(height: 6),
          Text('$memorised of 99 memorised', style: label(11.5, color: Colors.white, letter: 1)),
        ]),
      ),
      const SizedBox(height: 14),
      Panel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Eyebrow(weekNames.isEmpty ? 'Week ${week.number} · revision' : 'Week ${week.number} · names ${weekNames.first + 1}${weekNames.length > 1 ? ' and ${weekNames.last + 1}' : ''}'),
          const SizedBox(height: 6),
          Text(
            weekNames.isEmpty ? 'This week, revise the names you know and call upon Allah by them.' : 'Two names a week covers all ninety-nine in a year. Say them after each prayer until they are firm.',
            style: serif(15),
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 10, runSpacing: 8, children: [
            FilledButton.icon(
              onPressed: due.isEmpty ? null : () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ReviewPage(queue: List.of(due)))),
              icon: const Icon(Icons.style, size: 18),
              label: Text(due.isEmpty ? 'Nothing to review' : 'Review ${due.length} ${due.length == 1 ? 'name' : 'names'}'),
            ),
            if (weekNames.isNotEmpty)
              OutlinedButton.icon(
                onPressed: () {
                  for (final i in weekNames) {
                    store.startName(i, app.today);
                  }
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Learn this week\'s'),
              ),
          ]),
        ]),
      ),
      Panel(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF14302B) : Zc.soft,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Eyebrow('The hadith'),
          const SizedBox(height: 8),
          HadithView(c.namesHadith, arSize: 20, enSize: 14.5),
        ]),
      ),
      for (final n in c.names) _NameTile(n: n),
    ]);
  }
}

class _NameTile extends StatelessWidget {
  const _NameTile({required this.n});
  final NameOfAllah n;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final box = app.store.boxOf(n.index);
    final inWeek = namesOfWeek(weekOf(app.today).number, 99).contains(n.index);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: inWeek ? Zc.gold : Zc.line.withValues(alpha: .7), width: inWeek ? 1.8 : 1)),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => showName(context, n),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(children: [
              SizedBox(width: 28, child: Text('${n.index + 1}', style: label(11, color: Zc.gold, letter: .2, wght: 700))),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(n.transliteration, style: display(13.5, letter: .8)),
                  Text(n.meaning, style: serif(13.5, style: FontStyle.italic, color: Zc.muted)),
                ]),
              ),
              Text(n.arabic, textDirection: TextDirection.rtl, style: ar(28, color: Theme.of(context).colorScheme.primary, height: 1.4)),
              const SizedBox(width: 10),
              Icon(box >= 5 ? Icons.verified : (box > 0 ? Icons.timelapse : Icons.radio_button_unchecked), size: 21, color: box >= 5 ? Zc.green : (box > 0 ? Zc.gold : Zc.line)),
            ]),
          ),
        ),
      ),
    );
  }
}

void showName(BuildContext context, NameOfAllah n) {
  final app = AppScope.of(context);
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => ListenableBuilder(
      listenable: app,
      builder: (ctx, _) {
        final box = app.store.boxOf(n.index);
        final short = n.transliteration.replaceFirst(RegExp(r'^(Al|An|Ar|As|At|Ash|Az|Ad)-'), '');
        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Eyebrow('Name ${n.index + 1} of 99'),
              Text(n.arabic, textDirection: TextDirection.rtl, style: ar(64, color: Theme.of(ctx).colorScheme.primary, height: 1.5)),
              Text(n.transliteration, style: display(22)),
              Text(n.meaning, style: serif(17, style: FontStyle.italic, color: Zc.muted)),
              const SizedBox(height: 14),
              Text(n.live, textAlign: TextAlign.center, style: serif(16.5)),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Theme.of(ctx).brightness == Brightness.dark ? const Color(0xFF14302B) : Zc.soft, borderRadius: BorderRadius.circular(14)),
                child: Column(children: [
                  const Eyebrow('Call upon Him by it'),
                  const SizedBox(height: 6),
                  Text('Ya $short, ...', style: serif(17, style: FontStyle.italic)),
                  const SizedBox(height: 4),
                  Text('Begin your dua with this name, then ask.', style: serif(13.5, color: Zc.muted)),
                ]),
              ),
              const SizedBox(height: 16),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                if (box == 0)
                  FilledButton.icon(onPressed: () => app.store.startName(n.index, app.today), icon: const Icon(Icons.add), label: const Text('Start learning'))
                else if (box < 5)
                  FilledButton.icon(onPressed: () => app.store.setMemorised(n.index, true, app.today), icon: const Icon(Icons.verified), label: const Text('I know it'))
                else
                  OutlinedButton.icon(onPressed: () => app.store.setMemorised(n.index, false, app.today), icon: const Icon(Icons.replay), label: const Text('Practise again')),
              ]),
            ]),
          ),
        );
      },
    ),
  );
}

/// Flashcards: say the name, flip, and say whether you knew it. The ones you miss come back sooner.
class ReviewPage extends StatefulWidget {
  const ReviewPage({super.key, required this.queue});
  final List<int> queue;
  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  bool flipped = false;
  int knew = 0, done = 0;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final finished = widget.queue.isEmpty;
    final total = done + widget.queue.length;
    return Scaffold(
      appBar: AppBar(title: Text('Review', style: display(18))),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: finished
            ? Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.celebration, size: 54, color: Zc.gold),
                  const SizedBox(height: 12),
                  Text('Masha Allah', style: display(24)),
                  Text('You knew $knew of $done.', style: serif(17)),
                  const SizedBox(height: 18),
                  FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Done')),
                ]),
              )
            : Column(children: [
                LinearProgressIndicator(value: done / total, minHeight: 6, borderRadius: BorderRadius.circular(6)),
                const SizedBox(height: 18),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => flipped = true),
                    child: Card(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(22),
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                            Text(app.content.names[widget.queue.first].arabic, textDirection: TextDirection.rtl, style: ar(76, color: Theme.of(context).colorScheme.primary, height: 1.5)),
                            const SizedBox(height: 14),
                            if (!flipped) Text('Tap to see the name and meaning', style: label(11, color: Zc.muted, letter: 1))
                            else ...[
                              Text(app.content.names[widget.queue.first].transliteration, style: display(24)),
                              Text(app.content.names[widget.queue.first].meaning, style: serif(18, style: FontStyle.italic, color: Zc.muted)),
                              const SizedBox(height: 12),
                              Text(app.content.names[widget.queue.first].live, textAlign: TextAlign.center, style: serif(15.5)),
                            ],
                          ]),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: OutlinedButton(onPressed: flipped ? () => _answer(app, false) : null, child: const Text('Again'))),
                  const SizedBox(width: 12),
                  Expanded(child: FilledButton(onPressed: flipped ? () => _answer(app, true) : null, child: const Text('Got it'))),
                ]),
              ]),
      ),
    );
  }

  void _answer(AppState app, bool got) {
    final i = widget.queue.removeAt(0);
    app.store.answerName(i, got, app.today);
    setState(() {
      flipped = false;
      done++;
      if (got) knew++;
    });
  }
}
