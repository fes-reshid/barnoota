import 'package:material_ui/material_ui.dart';

import '../core/theme.dart';
import '../data/content.dart';

/// A rounded card with comfortable padding.
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.color, this.margin = const EdgeInsets.fromLTRB(16, 0, 16, 12)});
  final Widget child;
  final EdgeInsets padding, margin;
  final Color? color;

  @override
  Widget build(BuildContext context) => Padding(
        padding: margin,
        child: Card(color: color, child: Padding(padding: padding, child: SizedBox(width: double.infinity, child: child))),
      );
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: label(10.5, color: color ?? Zc.gold, letter: 1.6, wght: 700));
}

/// A small toggle used for the prayer chips.
class ZChip extends StatelessWidget {
  const ZChip({super.key, required this.title, required this.selected, required this.onTap, this.color = Zc.green, this.sub});
  final String title;
  final String? sub;
  final bool selected;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      button: true,
      selected: selected,
      label: title,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? color : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: selected ? color : (dark ? const Color(0xFF3A5F58) : Zc.line), width: 1.2),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (selected) const Padding(padding: EdgeInsets.only(right: 5), child: Icon(Icons.check, size: 15, color: Colors.white)),
            Text(title, style: label(12.5, color: selected ? Colors.white : null, letter: .3, wght: 600)),
            if (sub != null && sub!.isNotEmpty)
              Padding(padding: const EdgeInsets.only(left: 5), child: Text(sub!, style: label(9.5, color: selected ? Colors.white70 : Zc.muted, letter: .2, wght: 500))),
          ]),
        ),
      ),
    );
  }

}

/// A checkbox row for one task, with an (i) that opens the hadith behind it.
class TaskRow extends StatelessWidget {
  const TaskRow({super.key, required this.task, required this.checked, required this.onChanged, this.hadith, this.color = Zc.green});
  final String task;
  final bool checked;
  final ValueChanged<bool> onChanged;
  final Hadith? hadith;
  final Color color;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => onChanged(!checked),
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 140),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: checked ? color : Colors.transparent,
                borderRadius: BorderRadius.circular(7),
                border: Border.all(color: color, width: 1.6),
              ),
              child: checked ? const Icon(Icons.check, size: 17, color: Colors.white) : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(task,
                  style: serif(15.5, wght: 450).copyWith(decoration: checked ? TextDecoration.lineThrough : null, decorationColor: Zc.muted, color: checked ? Zc.muted : null)),
            ),
            if (hadith != null)
              IconButton(
                visualDensity: VisualDensity.compact,
                tooltip: 'The hadith behind this',
                icon: const Icon(Icons.menu_book_outlined, size: 20, color: Zc.gold),
                onPressed: () => showHadith(context, hadith!),
              ),
          ]),
        ),
      );
}

/// A hadith in Arabic and English with its narrator and source.
class HadithView extends StatelessWidget {
  const HadithView(this.h, {super.key, this.arSize = 22, this.enSize = 15.5});
  final Hadith h;
  final double arSize, enSize;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (h.arabic.isNotEmpty) Text(h.arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.right, style: ar(arSize, color: Theme.of(context).colorScheme.primary)),
        const SizedBox(height: 6),
        Text(h.english.startsWith('“') ? h.english : '“${h.english}”', style: serif(enSize, style: FontStyle.italic, height: 1.5)),
        const SizedBox(height: 6),
        Text(h.source.toUpperCase(), style: label(10, color: Zc.muted, letter: 1)),
      ]);
}

void showHadith(BuildContext context, Hadith h) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Eyebrow(h.label),
          const SizedBox(height: 10),
          HadithView(h, arSize: 26, enSize: 17),
        ]),
      ),
    ),
  );
}
