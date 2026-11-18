import 'dart:math' as math;

import 'package:flutter_compass/flutter_compass.dart';
import 'package:material_ui/material_ui.dart';

import '../app_state.dart';
import '../core/theme.dart';
import '../data/cities.dart';
import '../logic/prayer.dart';
import 'widgets.dart';

const _makkah = Place('Makkah', 21.4225, 39.8262);

class QiblaScreen extends StatefulWidget {
  const QiblaScreen({super.key, this.headings});

  /// The phone's compass heading in degrees; given directly in tests.
  final Stream<double?>? headings;
  @override
  State<QiblaScreen> createState() => _QiblaScreenState();
}

class _QiblaScreenState extends State<QiblaScreen> {
  Stream<double?>? _stream;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _stream ??= widget.headings ?? AppScope.of(context).headings ?? FlutterCompass.events?.map((e) => e.heading);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final place = app.place;
    if (place == null) {
      return Center(child: Text('Choose your place in Settings to find the Qibla.', style: serif(16)));
    }
    final bearing = qiblaFrom(place);
    final km = distanceKm(place, _makkah);
    return ListView(padding: const EdgeInsets.only(bottom: 24), children: [
      Container(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
        decoration: const BoxDecoration(gradient: LinearGradient(colors: [Zc.deep, Zc.green]), border: Border(bottom: BorderSide(color: Zc.gold2, width: 3))),
        child: Column(children: [
          Text('QIBLA', style: display(22, color: Zc.gold2, letter: 3)),
          Text('القِبْلَة', style: ar(28, color: Zc.gold2, height: 1.4)),
          Text('${place.name} · ${bearing.round()}° from north · ${km.round()} km to Makkah', style: label(10.5, color: Colors.white70, letter: .8)),
        ]),
      ),
      const SizedBox(height: 16),
      StreamBuilder<double?>(
        stream: _stream,
        builder: (context, snap) {
          final heading = snap.data;
          final has = heading != null;
          final diff = has ? ((bearing - heading + 540) % 360) - 180 : null;
          final facing = diff != null && diff.abs() < 3;
          return Column(children: [
            Center(child: SizedBox(width: 300, height: 300, child: CustomPaint(painter: _CompassPainter(heading ?? 0, bearing, facing, Theme.of(context).brightness == Brightness.dark)))),
            const SizedBox(height: 10),
            Panel(
              color: facing ? Zc.green : null,
              child: Text(
                !has
                    ? 'No compass found on this phone. The Qibla is ${bearing.round()}° from north: face north, then turn to ${bearing.round()}°.'
                    : facing
                        ? 'You are facing the Qibla.'
                        : 'Turn ${(diff ?? 0) > 0 ? 'right' : 'left'} ${(diff ?? 0).abs().round()}°',
                textAlign: TextAlign.center,
                style: serif(17, color: facing ? Colors.white : null, wght: 600),
              ),
            ),
          ]);
        },
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Text('Hold the phone flat, away from metal and magnets. If the arrow drifts, move the phone in a figure of eight to calibrate it.',
            textAlign: TextAlign.center, style: serif(13.5, color: Zc.muted)),
      ),
    ]);
  }
}

class _CompassPainter extends CustomPainter {
  _CompassPainter(this.heading, this.qibla, this.facing, this.dark);
  final double heading, qibla;
  final bool facing, dark;

  double rad(double deg) => deg * math.pi / 180;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2 - 10;
    canvas.drawCircle(c, r, Paint()..color = (dark ? const Color(0xFF14302B) : Colors.white));
    canvas.drawCircle(c, r, Paint()..style = PaintingStyle.stroke..strokeWidth = 3..color = facing ? Zc.green : Zc.gold);
    // the ring turns with the phone, so north stays north
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(rad(-heading));
    for (var d = 0; d < 360; d += 10) {
      final big = d % 90 == 0;
      final a = rad(d.toDouble()) - math.pi / 2;
      canvas.drawLine(Offset(math.cos(a), math.sin(a)) * (r - (big ? 22 : 12)), Offset(math.cos(a), math.sin(a)) * (r - 4), Paint()..strokeWidth = big ? 2.4 : 1..color = Zc.muted);
    }
    for (final e in const {'N': 0, 'E': 90, 'S': 180, 'W': 270}.entries) {
      final a = rad(e.value.toDouble()) - math.pi / 2;
      final p = Offset(math.cos(a), math.sin(a)) * (r - 36);
      final tp = TextPainter(text: TextSpan(text: e.key, style: display(15, color: e.key == 'N' ? Zc.maghrib : Zc.muted)), textDirection: TextDirection.ltr)..layout();
      canvas.save();
      canvas.translate(p.dx, p.dy);
      canvas.rotate(rad(heading));
      tp.paint(canvas, -Offset(tp.width / 2, tp.height / 2));
      canvas.restore();
    }
    // the Ka'bah, at the bearing of the Qibla on that ring
    final qa = rad(qibla) - math.pi / 2;
    final kp = Offset(math.cos(qa), math.sin(qa)) * (r - 60);
    canvas.drawLine(Offset.zero, kp * .82, Paint()..strokeWidth = 4..strokeCap = StrokeCap.round..color = (facing ? Zc.green : Zc.gold));
    canvas.save();
    canvas.translate(kp.dx, kp.dy);
    canvas.rotate(rad(heading));
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: 38, height: 38), const Radius.circular(5)), Paint()..color = const Color(0xFF14110D));
    canvas.drawRect(Rect.fromCenter(center: const Offset(0, -6), width: 38, height: 6), Paint()..color = Zc.gold2);
    canvas.restore();
    canvas.restore();
    // the fixed pointer: the way the top of the phone faces
    final tri = Path()
      ..moveTo(c.dx, c.dy - r + 2)
      ..lineTo(c.dx - 11, c.dy - r + 26)
      ..lineTo(c.dx + 11, c.dy - r + 26)
      ..close();
    canvas.drawPath(tri, Paint()..color = Zc.maghrib);
    canvas.drawCircle(c, 6, Paint()..color = Zc.deep);
  }

  @override
  bool shouldRepaint(_CompassPainter o) => o.heading != heading || o.qibla != qibla || o.facing != facing;
}
