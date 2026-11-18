import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import '../core/theme.dart';
import '../logic/plan.dart';
import '../logic/prayer.dart';

String clock(DateTime d) => '${two(d.hour)}:${two(d.minute)}';

String countdown(Duration d) {
  if (d.isNegative) return 'now';
  final h = d.inHours, m = d.inMinutes % 60;
  if (h == 0) return m <= 1 ? 'in a minute' : 'in $m min';
  return 'in ${h}h ${two(m)}m';
}

/// A 24-hour ring for the day, midnight at the top. Each window of the day has its own colour,
/// the prayers sit on the ring, and a dot marks the time now.
class DayDial extends StatelessWidget {
  const DayDial({super.key, required this.times, required this.now, required this.isToday, required this.next, this.size = 270});
  final DayTimes times;
  final DateTime now;
  final bool isToday;
  final ({String id, String name, DateTime time}) next;
  final double size;

  @override
  Widget build(BuildContext context) {
    final cur = isToday ? times.windowAt(now) : null;
    final curDef = cur == null ? null : windowsInOrder.firstWhere((w) => w.id == cur);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(alignment: Alignment.center, children: [
        CustomPaint(
          size: Size.square(size),
          painter: _DialPainter(times, isToday ? now : null, Theme.of(context).brightness == Brightness.dark),
        ),
        Column(mainAxisSize: MainAxisSize.min, children: [
          Text(isToday ? 'NEXT PRAYER' : 'PRAYER TIMES', style: label(10, color: Zc.gold, letter: 1.8, wght: 700)),
          const SizedBox(height: 2),
          Text(isToday ? next.name : 'Fajr ${clock(times.fajr)}', style: display(isToday ? 30 : 22, color: Theme.of(context).colorScheme.primary)),
          Text(isToday ? countdown(next.time.difference(now)) : 'Maghrib ${clock(times.maghrib)}', style: serif(17, style: FontStyle.italic)),
          if (isToday) Text(clock(next.time), style: label(12, color: Zc.muted, letter: 1.2)),
          if (curDef != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: curDef.color, borderRadius: BorderRadius.circular(12)),
              child: Text(curDef.name, style: label(10.5, color: Colors.white, letter: .8)),
            ),
          ],
        ]),
      ]),
    );
  }
}

class _DialPainter extends CustomPainter {
  _DialPainter(this.t, this.now, this.dark);
  final DayTimes t;
  final DateTime? now;
  final bool dark;

  double f(DateTime d) => (d.difference(t.date).inSeconds / 86400).clamp(0.0, 1.0);

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    const stroke = 24.0;
    final r = size.width / 2 - stroke / 2 - 6;
    final rect = Rect.fromCircle(center: c, radius: r);
    const top = -math.pi / 2;
    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = (dark ? Colors.white : Zc.deep).withValues(alpha: .08);
    canvas.drawCircle(c, r, base);

    for (final w in windowsInOrder) {
      final a = f(t.startOf(w.id)), b = f(t.endOf(w.id));
      if (b <= a) continue;
      final p = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..color = (dark ? Color.lerp(w.color, Colors.white, .3)! : w.color).withValues(alpha: dark ? .95 : .9);
      canvas.drawArc(rect, top + a * 2 * math.pi + .012, (b - a) * 2 * math.pi - .024, false, p);
    }

    // hour marks at 00, 06, 12, 18
    for (var h = 0; h < 24; h += 6) {
      final ang = top + h / 24 * 2 * math.pi;
      final p1 = c + Offset(math.cos(ang), math.sin(ang)) * (r - stroke / 2 - 7);
      final tp = TextPainter(
        text: TextSpan(text: h == 0 ? '12am' : (h == 12 ? '12pm' : (h < 12 ? '${h}am' : '${h - 12}pm')), style: label(8.5, color: Zc.muted, letter: .2, wght: 500)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, p1 - Offset(tp.width / 2, tp.height / 2));
    }

    // the prayers
    for (final p in prayers) {
      final ang = top + f(t.timeOfPrayer(p.id)) * 2 * math.pi;
      final pos = c + Offset(math.cos(ang), math.sin(ang)) * r;
      canvas.drawCircle(pos, 5.2, Paint()..color = Colors.white);
      canvas.drawCircle(pos, 5.2, Paint()..style = PaintingStyle.stroke..strokeWidth = 1.4..color = dark ? Color.lerp(p.window.color, Colors.white, .3)! : p.window.color);
    }

    // now
    final n = now;
    if (n != null) {
      final ang = top + f(n) * 2 * math.pi;
      final pos = c + Offset(math.cos(ang), math.sin(ang)) * r;
      canvas.drawCircle(pos, 15, Paint()..color = Zc.gold2.withValues(alpha: .35));
      canvas.drawCircle(pos, 9, Paint()..color = Colors.white);
      canvas.drawCircle(pos, 9, Paint()..style = PaintingStyle.stroke..strokeWidth = 3..color = Zc.gold);
    }
  }

  @override
  bool shouldRepaint(_DialPainter o) => o.now != now || o.t.date != t.date || o.t.fajr != t.fajr || o.dark != dark;
}
